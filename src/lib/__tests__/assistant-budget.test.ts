import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyAssistantBudgetLimits } from '@/lib/assistant/budget';
import {
  getAiAssistantBudgetReserveCents,
  getAiAssistantMonthlyBudgetCents,
  hasAiGatewayAuth
} from '@/lib/config/server';

function assistantRequest(ip: string): Request {
  return new Request('http://localhost/api/assistant', {
    headers: { 'x-forwarded-for': ip }
  });
}

describe('assistant budget guard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.unstubAllEnvs();
    vi.stubEnv('AI_ASSISTANT_MONTHLY_BUDGET_CENTS', '10');
    vi.stubEnv('AI_ASSISTANT_BUDGET_RESERVE_CENTS', '5');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('defaults to a $50 monthly cap with a conservative per-message reserve', () => {
    vi.unstubAllEnvs();

    expect(getAiAssistantMonthlyBudgetCents()).toBe(5_000);
    expect(getAiAssistantBudgetReserveCents()).toBe(5);
  });

  it('requires explicit AI Gateway credentials instead of a generic Vercel runtime flag', () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VERCEL', '1');
    expect(hasAiGatewayAuth()).toBe(false);

    vi.stubEnv('VERCEL_OIDC_TOKEN', 'test-oidc-token');
    expect(hasAiGatewayAuth()).toBe(true);
  });

  it('reserves monthly budget before model calls and blocks before exceeding the cap', async () => {
    vi.setSystemTime(new Date('2026-02-10T12:00:00.000Z'));

    const first = await applyAssistantBudgetLimits(assistantRequest('198.51.100.10'));
    const second = await applyAssistantBudgetLimits(assistantRequest('198.51.100.10'));
    const blocked = await applyAssistantBudgetLimits(assistantRequest('198.51.100.10'));

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    await expect(blocked!.json()).resolves.toEqual({
      error:
        'The assistant has reached its monthly budget limit. Please try again next month.'
    });
  });

  it('starts a new monthly budget window on the first UTC day of the month', async () => {
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'));
    vi.stubEnv('AI_ASSISTANT_MONTHLY_BUDGET_CENTS', '5');

    const first = await applyAssistantBudgetLimits(assistantRequest('198.51.100.20'));
    const blocked = await applyAssistantBudgetLimits(assistantRequest('198.51.100.20'));

    vi.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
    const nextMonth = await applyAssistantBudgetLimits(assistantRequest('198.51.100.20'));

    expect(first).toBeNull();
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(nextMonth).toBeNull();
  });
});
