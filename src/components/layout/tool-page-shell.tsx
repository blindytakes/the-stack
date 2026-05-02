import type { ReactNode } from 'react';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';

type ToolPageShellProps = {
  tool:
    | 'card_finder'
    | 'business_plan'
    | 'card_vs_card'
    | 'personal_finance_tracker'
    | 'premium_card_calculator'
    | 'card_benefit_calendar'
    | 'points_redemption_advisor';
  path:
    | '/tools/card-finder'
    | '/tools/card-vs-card'
    | '/tools/personal-finance-tracker'
    | '/tools/premium-card-calculator'
    | '/tools/card-benefit-calendar'
    | '/tools/points-advisor';
  title: string;
  description: string;
  children: ReactNode;
  hideHeader?: boolean;
  containerClassName?: string;
};

export function ToolPageShell({
  tool,
  path,
  title,
  description,
  children,
  hideHeader = false,
  containerClassName
}: ToolPageShellProps) {
  return (
    <div className={`container-page min-h-[calc(100vh-4rem)] pt-12 ${containerClassName ?? ''}`.trim()}>
      <TrackFunnelEventOnView
        event="tool_started"
        properties={{ source: 'page_view', tool, path }}
      />
      {!hideHeader ? (
        <div className="mb-8 max-w-2xl">
          <h1 className="font-heading text-4xl text-text-primary">{title}</h1>
          {description && (
            <p className="mt-3 text-base text-text-secondary">{description}</p>
          )}
        </div>
      ) : null}
      {children}
    </div>
  );
}
