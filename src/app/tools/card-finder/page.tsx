import type { Metadata } from 'next';
import { CardFinderPathChooser, CardFinderTool } from '@/components/tools/card-finder';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { getCardsData } from '@/lib/cards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bonus Plan',
  description:
    'Build a combined card-and-bank bonus plan using your spend capacity, credit profile, direct deposit access, and state.'
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
          ? 'Pick your path, then answer a few quick questions.'
          : showingFullPlanner
          ? 'Answer a few questions and we\'ll build your 6-month bonus plan.'
          : ''
      }
    >
      {showingChooser ? <CardFinderPathChooser /> : <CardFinderTool cards={cards} />}
    </ToolPageShell>
  );
}
