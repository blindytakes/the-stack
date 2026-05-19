import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage
} from 'ai';

export function staticAssistantResponse(text: string, init?: ResponseInit): Response {
  const stream = createUIMessageStream<UIMessage>({
    execute: ({ writer }) => {
      const textId = 'static-text';
      writer.write({ type: 'start' });
      writer.write({ type: 'text-start', id: textId });
      writer.write({ type: 'text-delta', id: textId, delta: text });
      writer.write({ type: 'text-end', id: textId });
      writer.write({ type: 'finish', finishReason: 'stop' });
    }
  });

  return createUIMessageStreamResponse({
    ...init,
    stream
  });
}
