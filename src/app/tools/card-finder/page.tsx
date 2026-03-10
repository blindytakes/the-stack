import type { Metadata } from 'next';
import { CardFinderPathChooser, CardFinderTool } from '@/components/tools/card-finder';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { getCardsData } from '@/lib/cards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bonus Plan',
  description:
    'Build a combined card-and-bank bonus plan. We ask about your current cards, Chase status, and direct deposit so the recommendations are actually doable.'
};

type Props = {
  searchParams: Promise<{ mode?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CardFinderPage({ searchParams }: Props) {
  const search = await searchParams;
  const mode = firstParam(search.mode);
  const showingChooser = mode === 'choose';
  const showingFullPlanner = !showingChooser;
  const cards = showingFullPlanner ? (await getCardsData()).cards : [];

  return (
    <ToolPageShell
      tool="card_finder"
      path="/tools/card-finder"
      tag="Tool 01"
      tagColorClassName="text-brand-teal"
      title="Bonus Plan"
      description={
        showingChooser
          ? 'Choose whether you want the full card-and-bank planner or the shorter card-only path before you start answering questions.'
          : showingFullPlanner
          ? 'This planner includes both card bonuses and bank bonuses. We ask about your current cards, Chase status, and direct deposit so the 12-month plan is grounded in offers you can actually complete.'
          : ''
      }
    >
      {showingChooser ? <CardFinderPathChooser /> : <CardFinderTool cards={cards} />}
    </ToolPageShell>
  );
}
