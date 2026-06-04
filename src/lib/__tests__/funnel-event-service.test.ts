import { beforeEach, describe, expect, it, vi } from 'vitest';

const recordFunnelEventMock = vi.fn();

vi.mock('@/lib/metrics', () => ({
  recordFunnelEvent: (...args: unknown[]) => recordFunnelEventMock(...args)
}));

import { ingestFunnelEvent } from '@/lib/services/funnel-event-service';

describe('ingestFunnelEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records low-cardinality labels for valid events', () => {
    const result = ingestFunnelEvent({
      event: 'card_detail_view',
      properties: {
        path: '/cards/chase-sapphire-preferred?src=homepage',
        source: 'Card Detail Page!',
        card_slug: 'chase-sapphire-preferred'
      }
    });

    expect(result).toEqual({ ok: true });
    expect(recordFunnelEventMock).toHaveBeenCalledWith('card_detail_view', {
      path: '/cards/[slug]',
      source: 'card_detail_page',
      tool: 'none',
      entity_type: 'card'
    });
  });

  it('keeps tool names but omits slugs from metric labels', () => {
    const result = ingestFunnelEvent({
      event: 'tool_started',
      properties: {
        path: '/tools/card-finder',
        source: 'homepage',
        tool: 'card-finder'
      }
    });

    expect(result).toEqual({ ok: true });
    expect(recordFunnelEventMock).toHaveBeenCalledWith('tool_started', {
      path: '/tools/card-finder',
      source: 'homepage',
      tool: 'card-finder',
      entity_type: 'tool'
    });
  });

  it('rejects invalid payloads', () => {
    expect(ingestFunnelEvent(null)).toEqual({ ok: false, error: 'Invalid JSON' });
    expect(ingestFunnelEvent({ event: 'unknown_event' })).toEqual({
      ok: false,
      error: 'Invalid payload'
    });
    expect(recordFunnelEventMock).not.toHaveBeenCalled();
  });
});
