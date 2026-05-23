import { NextResponse } from 'next/server';
import { convertToModelMessages, streamText } from 'ai';
import { apiRateLimits } from '@/lib/api-rate-limits';
import { createApiRoute } from '@/lib/api-route';
import {
  getAiAssistantModel,
  hasAiGatewayAuth,
  isAiAssistantEnabled
} from '@/lib/config/server';
import { applyAssistantBudgetLimits } from '@/lib/assistant/budget';
import { buildAssistantContext } from '@/lib/assistant/context';
import { sanitizeAssistantMessages, toUiMessages } from '@/lib/assistant/messages';
import {
  flushAssistantObservability,
  getAssistantConversationId,
  getAssistantStreamHooks
} from '@/lib/assistant/observability';
import { buildAssistantSystemPrompt } from '@/lib/assistant/prompt';
import { checkAssistantSafety } from '@/lib/assistant/safety';
import { staticAssistantResponse } from '@/lib/assistant/stream-response';

export const runtime = 'nodejs';
export const maxDuration = 20;

export const POST = createApiRoute({
  route: '/api/assistant',
  method: 'POST',
  requireValidOrigin: true,
  rateLimit: apiRateLimits.assistantChat,
  handler: async (req: Request) => {
    if (!isAiAssistantEnabled()) {
      return NextResponse.json({ error: 'Assistant is disabled' }, { status: 404 });
    }

    const body = (await req.json()) as unknown;
    const validation = sanitizeAssistantMessages(
      typeof body === 'object' && body !== null && 'messages' in body
        ? (body as { messages?: unknown }).messages
        : undefined
    );

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const safety = checkAssistantSafety(validation.lastUserText);
    if (safety.blocked) {
      return staticAssistantResponse(safety.response);
    }

    if (!hasAiGatewayAuth()) {
      return staticAssistantResponse(
        'The Stack assistant UI is installed, but AI Gateway credentials are not configured yet. Add AI_GATEWAY_API_KEY locally or enable Vercel AI Gateway/OIDC in production, then try again.'
      );
    }

    const budgetLimited = await applyAssistantBudgetLimits(req);
    if (budgetLimited) {
      return budgetLimited;
    }

    const context = await buildAssistantContext(validation.lastUserText);
    const messages = toUiMessages([
      {
        id: 'last-user-message',
        role: 'user',
        parts: [{ type: 'text', text: validation.lastUserText }]
      }
    ]);
    const sigilHooks = getAssistantStreamHooks(
      getAssistantConversationId(validation.messages)
    );
    const result = streamText({
      model: getAiAssistantModel(),
      system: buildAssistantSystemPrompt(context.text),
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 450,
      providerOptions: {
        gateway: {
          tags: ['feature:assistant', 'surface:site-chat']
        }
      },
      ...sigilHooks,
      onError: async (event) => {
        await sigilHooks.onError?.(event);
        await flushAssistantObservability();
      },
      onAbort: async (event) => {
        await sigilHooks.onAbort?.(event);
        await flushAssistantObservability();
      },
      onFinish: async () => {
        await flushAssistantObservability();
      }
    });

    return result.toUIMessageStreamResponse();
  }
});
