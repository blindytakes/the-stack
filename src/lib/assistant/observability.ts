import type { StreamTextHooks } from '@grafana/sigil-sdk-js/vercel-ai-sdk';
import { SigilClient } from '@grafana/sigil-sdk-js';
import { createSigilVercelAiSdk } from '@grafana/sigil-sdk-js/vercel-ai-sdk';
import type { AssistantTextMessage } from '@/lib/assistant/messages';
import { getSigilEnvStatus } from '@/lib/observability-config';

const ASSISTANT_AGENT_NAME = 'the-stack-assistant';
const DEFAULT_SIGIL_PROTOCOL = 'http';
const DEFAULT_CONTENT_CAPTURE = 'metadata_only';

type SigilProtocol = 'grpc' | 'http' | 'none';

type AssistantSigilRuntime = {
  client: SigilClient;
  hooks: ReturnType<typeof createSigilVercelAiSdk>;
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
    client,
    hooks: createSigilVercelAiSdk(client, {
      agentName: ASSISTANT_AGENT_NAME,
      agentVersion: getAgentVersion(),
      captureInputs: contentCapture !== 'metadata_only',
      captureOutputs: contentCapture !== 'metadata_only',
      extraTags: {
        feature: 'assistant',
        surface: 'site-chat'
      },
      extraMetadata: {
        route: '/api/assistant'
      }
    })
  };

  return sigilRuntime;
}

export function getAssistantConversationId(messages: AssistantTextMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  return `site-chat:${firstUserMessage?.id ?? 'unknown'}`;
}

export function getAssistantStreamHooks(conversationId: string): StreamTextHooks {
  const runtime = getSigilRuntime();
  if (!runtime) return {};

  return runtime.hooks.streamTextHooks({
    conversationId,
    agentName: ASSISTANT_AGENT_NAME,
    extraMetadata: {
      route: '/api/assistant',
      content_capture: getContentCaptureMode()
    }
  });
}

export async function flushAssistantObservability() {
  const runtime = getSigilRuntime();
  if (!runtime) return;

  await runtime.client.flush();
}
