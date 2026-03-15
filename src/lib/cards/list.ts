import type { CardRecord, CardsQuery } from '@/lib/cards/schema';

export function filterCards(cards: CardRecord[], query: CardsQuery) {
  return cards.filter((card) => {
    if (query.issuer && !card.issuer.toLowerCase().includes(query.issuer.toLowerCase())) {
      return false;
    }

    if (
      query.category &&
      !card.topCategories.some((category) => category.toLowerCase() === query.category?.toLowerCase())
    ) {
      return false;
    }

    if (typeof query.maxFee === 'number' && card.annualFee > query.maxFee) {
      return false;
    }

    return true;
  });
}

export function paginateCards(cards: CardRecord[], query: Pick<CardsQuery, 'limit' | 'offset'>) {
  return cards.slice(query.offset, query.offset + query.limit);
}
