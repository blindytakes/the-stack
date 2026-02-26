import { NextResponse } from 'next/server';
import cards from '../../../../content/cards/cards.json';

type QuizRequest = {
  goal: 'cashback' | 'travel' | 'flexibility';
  spend: 'groceries' | 'dining' | 'travel' | 'everything';
  fee: 'no_fee' | 'up_to_95' | 'over_95_ok';
  credit: 'excellent' | 'good' | 'fair' | 'building';
};

type CardRecord = {
  slug: string;
  name: string;
  issuer: string;
  rewardType: 'cashback' | 'points' | 'miles';
  topCategories: string[];
  annualFee: number;
  creditTierMin: 'excellent' | 'good' | 'fair' | 'building';
  headline: string;
};

const creditRank: Record<CardRecord['creditTierMin'], number> = {
  excellent: 4,
  good: 3,
  fair: 2,
  building: 1
};

const goalMap: Record<QuizRequest['goal'], CardRecord['rewardType'][]> = {
  cashback: ['cashback'],
  travel: ['points', 'miles'],
  flexibility: ['cashback', 'points', 'miles']
};

function scoreCard(card: CardRecord, input: QuizRequest) {
  let score = 0;

  if (!goalMap[input.goal].includes(card.rewardType)) {
    score -= 1;
  } else {
    score += input.goal === 'flexibility' ? 2 : 3;
  }

  if (card.topCategories.includes(input.spend) || card.topCategories.includes('all')) {
    score += 2;
  }

  const fee = card.annualFee;
  if (input.fee === 'no_fee') {
    score += fee === 0 ? 2 : -2;
  } else if (input.fee === 'up_to_95') {
    score += fee <= 95 ? 2 : -1;
  } else {
    score += fee > 95 ? 1 : 0;
  }

  return score;
}

function isValid(input: QuizRequest) {
  return Boolean(input.goal && input.spend && input.fee && input.credit);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<QuizRequest>;

    if (!body || !isValid(body as QuizRequest)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const input = body as QuizRequest;
    const eligible = (cards as CardRecord[]).filter(
      (card) => creditRank[card.creditTierMin] <= creditRank[input.credit]
    );

    const ranked = eligible
      .map((card) => ({
        ...card,
        score: scoreCard(card, input)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return NextResponse.json({ results: ranked });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
