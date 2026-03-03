import type { ReactNode } from 'react';
import { TrackFunnelEventOnView } from '@/components/analytics/funnel-events';

type ToolPageShellProps = {
  tool: 'card_finder' | 'hidden_benefits' | 'card_vs_card';
  path: '/tools/card-finder' | '/tools/hidden-benefits' | '/tools/card-vs-card';
  tag: string;
  tagColorClassName: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function ToolPageShell({
  tool,
  path,
  tag,
  tagColorClassName,
  title,
  description,
  children
}: ToolPageShellProps) {
  return (
    <div className="container-page pt-12">
      <TrackFunnelEventOnView
        event="tool_started"
        properties={{ source: 'page_view', tool, path }}
      />
      <div className="mb-10 max-w-2xl">
        <p className={`text-xs uppercase tracking-[0.3em] ${tagColorClassName}`}>{tag}</p>
        <h1 className="mt-3 font-heading text-4xl text-text-primary">{title}</h1>
        <p className="mt-4 text-lg text-text-secondary">{description}</p>
      </div>
      {children}
    </div>
  );
}
