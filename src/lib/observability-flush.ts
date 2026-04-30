import { metrics } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { getOTelExporterEnvStatus } from '@/lib/observability-config';

const MIN_FLUSH_INTERVAL_MS = 1000;
const FLUSH_TIMEOUT_MS = 1500;

type ForceFlushProvider = {
  forceFlush: (options?: { timeoutMillis?: number }) => Promise<void> | void;
};

let lastFlushStartedAt = 0;
let pendingFlush: Promise<void> | null = null;

function isForceFlushProvider(provider: unknown): provider is ForceFlushProvider {
  return Boolean(provider && typeof (provider as ForceFlushProvider).forceFlush === 'function');
}

function withTimeout(promise: Promise<void>, timeoutMs: number): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise,
    new Promise<void>((resolve) => {
      timeout = setTimeout(resolve, timeoutMs);
    })
  ]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}

async function forceFlushProvider(provider: unknown, name: string) {
  if (!isForceFlushProvider(provider)) return;

  try {
    await Promise.resolve(provider.forceFlush({ timeoutMillis: FLUSH_TIMEOUT_MS }));
  } catch (error) {
    console.warn(`[otel] Failed to flush ${name} telemetry:`, error);
  }
}

export function flushObservability(): Promise<void> {
  if (!getOTelExporterEnvStatus().configured) {
    return Promise.resolve();
  }

  if (pendingFlush) {
    return pendingFlush;
  }

  const now = Date.now();
  if (now - lastFlushStartedAt < MIN_FLUSH_INTERVAL_MS) {
    return Promise.resolve();
  }

  lastFlushStartedAt = now;
  pendingFlush = Promise.allSettled([
    withTimeout(forceFlushProvider(metrics.getMeterProvider(), 'metric'), FLUSH_TIMEOUT_MS),
    withTimeout(forceFlushProvider(logs.getLoggerProvider(), 'log'), FLUSH_TIMEOUT_MS)
  ])
    .then(() => undefined)
    .finally(() => {
      pendingFlush = null;
    });

  return pendingFlush;
}
