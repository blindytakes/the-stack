import type { UIMessage } from 'ai';
import { normalizeAssistantText } from '@/lib/assistant/normalize';

const MAX_ASSISTANT_MESSAGES = 6;
const MAX_MESSAGE_TEXT_CHARS = 800;

export type AssistantTextMessage = {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: 'text'; text: string }>;
};

export type AssistantMessageValidation =
  | { ok: true; messages: AssistantTextMessage[]; lastUserText: string }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function textFromPart(part: unknown): string {
  if (!isRecord(part)) return '';
  if (part.type !== 'text') return '';
  return typeof part.text === 'string' ? part.text : '';
}

function textFromMessage(message: unknown): string {
  if (!isRecord(message) || !Array.isArray(message.parts)) return '';
  return message.parts.map(textFromPart).filter(Boolean).join('\n').trim();
}

function trimForModel(text: string): string {
  const normalized = normalizeAssistantText(text).replace(/\s+/g, ' ').trim();
  return normalized.length > MAX_MESSAGE_TEXT_CHARS
    ? `${normalized.slice(0, MAX_MESSAGE_TEXT_CHARS)}...`
    : normalized;
}

export function getLastUserText(messages: unknown): string {
  if (!Array.isArray(messages)) return '';

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (isRecord(message) && message.role === 'user') {
      return trimForModel(textFromMessage(message));
    }
  }

  return '';
}

export function sanitizeAssistantMessages(messages: unknown): AssistantMessageValidation {
  if (!Array.isArray(messages)) {
    return { ok: false, error: 'Invalid assistant payload' };
  }

  const recent = messages.slice(-MAX_ASSISTANT_MESSAGES);
  const sanitized: AssistantTextMessage[] = [];

  for (const [index, message] of recent.entries()) {
    if (!isRecord(message)) {
      return { ok: false, error: 'Invalid assistant message' };
    }

    if (message.role !== 'user' && message.role !== 'assistant') {
      return { ok: false, error: 'Unsupported assistant message role' };
    }

    const text = trimForModel(textFromMessage(message));
    if (!text) continue;

    sanitized.push({
      id: typeof message.id === 'string' ? message.id : `msg-${index}`,
      role: message.role,
      parts: [{ type: 'text', text }]
    });
  }

  const lastUserText = getLastUserText(sanitized);
  if (!lastUserText) {
    return { ok: false, error: 'Ask a question before sending the assistant request' };
  }

  return {
    ok: true,
    messages: sanitized,
    lastUserText
  };
}

export function toUiMessages(messages: AssistantTextMessage[]): UIMessage[] {
  return messages as UIMessage[];
}
