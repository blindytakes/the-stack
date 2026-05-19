'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';

const starterPrompts = [
  'Which card should I compare for groceries?',
  'Help me find a low-effort banking bonus',
  'Which Stack tool should I use first?'
] as const;

function getMessageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .filter(Boolean)
    .join('\n');
}

function AssistantMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  const text = getMessageText(message);
  if (!text) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-sm leading-6 ${
          isUser
            ? 'bg-brand-teal text-black'
            : 'border border-white/10 bg-white/[0.04] text-text-primary'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{text}</div>
      </div>
    </div>
  );
}

export function AssistantLauncher() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/assistant',
        credentials: 'same-origin'
      }),
    []
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    clearError
  } = useChat({
    transport,
    experimental_throttle: 60
  });

  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, open, status]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  async function submitMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    clearError();
    setInput('');
    await sendMessage({ text: trimmed });
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="The Stack assistant"
          className="w-[calc(100vw-2rem)] max-w-[24rem] overflow-hidden rounded-[1.35rem] border border-white/12 bg-[rgba(10,10,15,0.96)] shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="font-heading text-xl leading-none text-text-primary">Ask The Stack</h2>
              <p className="mt-1 text-xs text-text-muted">Cards, banking, points</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-lg text-text-secondary transition hover:border-white/25 hover:text-text-primary"
              aria-label="Close assistant"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex max-h-[min(32rem,calc(100vh-13rem))] min-h-[18rem] flex-col gap-3 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-text-secondary">
                Start with a card, offer, or goal.
              </div>
            ) : (
              messages.map((message) => <AssistantMessage key={message.id} message={message} />)
            )}

            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-text-secondary">
                  Thinking
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-brand-coral/30 bg-brand-coral/10 p-3 text-sm leading-6 text-text-primary">
                The assistant could not respond. Try again in a moment.
              </div>
            ) : null}
          </div>

          {messages.length === 0 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 scrollbar-hide">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitMessage(prompt)}
                  disabled={busy}
                  className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-brand-teal/40 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="flex items-end gap-2 border-t border-white/10 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage(input);
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage(input);
                }
              }}
              maxLength={800}
              rows={1}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm leading-5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand-teal/50"
              placeholder="Ask a question"
              disabled={busy}
            />
            {busy ? (
              <button
                type="button"
                onClick={() => stop()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-text-primary transition hover:border-white/25"
                aria-label="Stop assistant response"
              >
                <span className="h-3 w-3 rounded-[0.15rem] bg-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-teal text-base font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Send message"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
                  <path
                    d="M10 15V5m0 0L5.75 9.25M10 5l4.25 4.25"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.9"
                  />
                </svg>
              </button>
            )}
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-14 items-center gap-2 rounded-full border border-brand-teal/30 bg-[rgba(10,10,15,0.92)] px-4 text-sm font-semibold text-text-primary shadow-[0_16px_48px_rgba(0,0,0,0.38)] backdrop-blur-xl transition hover:border-brand-teal/60 hover:bg-bg-elevated"
        aria-expanded={open}
        aria-label={open ? 'Hide The Stack assistant' : 'Open The Stack assistant'}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal text-black">
          ?
        </span>
        <span>Ask</span>
      </button>
    </div>
  );
}
