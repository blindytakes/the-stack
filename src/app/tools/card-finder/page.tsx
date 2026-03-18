import type { Metadata } from 'next';
import { CardFinderPathChooser, CardFinderTool } from '@/components/tools/card-finder';
import { ToolPageShell } from '@/components/layout/tool-page-shell';
import { getCardsData } from '@/lib/cards';
import { getBankingBonusesData } from '@/lib/banking-bonuses';

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

function getUniqueBankNames(bonuses: { bankName: string }[]): string[] {
  const seen = new Map<string, string>();
  for (const b of bonuses) {
    const key = b.bankName.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!seen.has(key)) {
      seen.set(key, b.bankName.trim());
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

export default async function CardFinderPage({ searchParams }: Props) {
  const search = await searchParams;
  const mode = firstParam(search.mode);
  const showingChooser = mode === 'choose';
  const showingFullPlanner = !showingChooser;

  const [cardsResult, bankingResult] = showingFullPlanner
    ? await Promise.all([getCardsData(), getBankingBonusesData()])
    : [{ cards: [] }, { bonuses: [] }];

  const cards = cardsResult.cards;
  const bankNames = getUniqueBankNames(bankingResult.bonuses);

  return (
    <ToolPageShell
      tool="card_finder"
      path="/tools/card-finder"
      title="The Stack Bonus Plan"
      description=""
    >
      {showingChooser ? <CardFinderPathChooser /> : <CardFinderTool cards={cards} bankNames={bankNames} />}
    </ToolPageShell>
  );
}
