import type { LanguageModelUsage, OnFinishEvent } from 'ai';
import type { GenerationRecorder, TokenUsage } from '@grafana/sigil-sdk-js';
import { SigilClient } from '@grafana/sigil-sdk-js';
import type { AssistantTextMessage } from '@/lib/assistant/messages';
import { getSigilEnvStatus } from '@/lib/observability-config';

const ASSISTANT_AGENT_NAME = 'the-stack-assistant';
const DEFAULT_SIGIL_PROTOCOL = 'http';
const DEFAULT_CONTENT_CAPTURE = 'metadata_only';

type SigilProtocol = 'grpc' | 'http' | 'none';

type AssistantSigilRuntime = {
  client: SigilClient;
};

export type AssistantGenerationHandle = {
  finish: (event: OnFinishEvent) => void;
  fail: (error: unknown) => void;
};

let sigilRuntime: AssistantSigilRuntime | null | undefined;

function getSigilProtocol(): SigilProtocol {
  const configured = process.env.SIGIL_PROTOCOL?.trim().toLowerCase();
  if (configured === 'grpc' || configured === 'http' || configured === 'none') {
    return configured;
  }
  return DEFAULT_SIGIL_PROTOCOL;
}

function getAgentVersion(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (sha) return sha.slice(0, 12);

  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID?.trim();
  if (deploymentId) return deploymentId;

  return process.env.NODE_ENV === 'production' ? 'production' : 'local';
}

function getContentCaptureMode() {
  const configured = process.env.SIGIL_CONTENT_CAPTURE_MODE?.trim().toLowerCase();
  if (configured === 'full' || configured === 'no_tool_content' || configured === 'metadata_only') {
    return configured;
  }
  return DEFAULT_CONTENT_CAPTURE;
}

function getSigilRuntime(): AssistantSigilRuntime | null {
  if (sigilRuntime !== undefined) return sigilRuntime;

  const status = getSigilEnvStatus();
  if (!status.configured) {
    sigilRuntime = null;
    return sigilRuntime;
  }

  const tenantId = process.env.SIGIL_AUTH_TENANT_ID?.trim() ?? '';
  const authToken = process.env.SIGIL_AUTH_TOKEN?.trim() ?? '';
  const contentCapture = getContentCaptureMode();
  const client = new SigilClient({
    generationExport: {
      protocol: getSigilProtocol(),
      endpoint: process.env.SIGIL_ENDPOINT?.trim() ?? '',
      auth: {
        mode: 'basic',
        tenantId,
        basicPassword: authToken
      }
    },
    contentCapture,
    agentName: ASSISTANT_AGENT_NAME,
    agentVersion: getAgentVersion(),
    tags: {
      feature: 'assistant',
      surface: 'site-chat',
      service: 'the-stack'
    }
  });

  sigilRuntime = {
    client
  };

  return sigilRuntime;
}

export function getAssistantConversationId(messages: AssistantTextMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  return `site-chat:${firstUserMessage?.id ?? 'unknown'}`;
}

function parseModelRef(model: string): { provider: string; name: string } {
  const [provider, ...nameParts] = model.split('/');
  const name = nameParts.join('/');

  return {
    provider: provider?.trim() || 'unknown',
    name: name.trim() || model
  };
}

export function mapAssistantUsage(usage: LanguageModelUsage | undefined): TokenUsage | undefined {
  if (!usage) return undefined;

  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    cacheReadInputTokens: usage.inputTokenDetails.cacheReadTokens,
    cacheWriteInputTokens: usage.inputTokenDetails.cacheWriteTokens,
    reasoningTokens: usage.outputTokenDetails.reasoningTokens ?? usage.reasoningTokens
  };
}

function getProviderGenerationId(event: OnFinishEvent): string | undefined {
  const gatewayGenerationId = event.providerMetadata?.gateway?.generationId;
  return typeof gatewayGenerationId === 'string' ? gatewayGenerationId : event.response.id;
}

function endRecorder(recorder: GenerationRecorder) {
  recorder.end();

  const error = recorder.getError();
  if (error) {
    console.error('[sigil] assistant generation recording failed', { error: error.message });
  }
}

export function startAssistantGeneration(
  conversationId: string,
  model: string
): AssistantGenerationHandle | null {
  const runtime = getSigilRuntime();
  if (!runtime) return null;

  const startedAt = new Date();
  const modelRef = parseModelRef(model);
  const recorder = runtime.client.startStreamingGeneration({
    conversationId,
    agentName: ASSISTANT_AGENT_NAME,
    agentVersion: getAgentVersion(),
    mode: 'STREAM',
    operationName: 'streamText',
    model: modelRef,
    tags: {
      feature: 'assistant',
      surface: 'site-chat',
      service: 'the-stack'
    },
    metadata: {
      route: '/api/assistant',
      content_capture: getContentCaptureMode()
    },
    startedAt,
    contentCapture: getContentCaptureMode()
  });

  let ended = false;

  return {
    finish(event) {
      if (ended) return;
      ended = true;

      const responseModel = event.response.modelId ?? event.model.modelId ?? modelRef.name;
      recorder.setResult({
        conversationId,
        agentName: ASSISTANT_AGENT_NAME,
        agentVersion: getAgentVersion(),
        operationName: 'streamText',
        responseId: getProviderGenerationId(event),
        responseModel,
        usage: mapAssistantUsage(event.totalUsage ?? event.usage),
        stopReason: event.finishReason,
        completedAt: new Date(),
        tags: {
          feature: 'assistant',
          surface: 'site-chat',
          service: 'the-stack'
        },
        metadata: {
          route: '/api/assistant',
          content_capture: getContentCaptureMode(),
          provider: event.model.provider,
          gateway_generation_id: event.providerMetadata?.gateway?.generationId
        }
      });
      endRecorder(recorder);
    },
    fail(error) {
      if (ended) return;
      ended = true;

      recorder.setCallError(error);
      endRecorder(recorder);
    }
  };
}

export async function flushAssistantObservability() {
  const runtime = getSigilRuntime();
  if (!runtime) return;

  try {
    await runtime.client.flush();
  } catch (error) {
    console.error('[sigil] assistant generation export failed', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
