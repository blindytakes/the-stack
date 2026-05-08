const curatedApplyUrlBySlug: Record<string, string> = {
  'capital-one-spark-1-5x-miles-select':
    'https://www.capitalone.com/small-business/credit-cards/travel-and-miles/',
  'capital-one-spark-2x-miles':
    'https://www.capitalone.com/small-business/credit-cards/travel-and-miles/',
  'discover-it-miles': 'https://www.discover.com/credit-cards/travel/'
};

export function resolveCardApplyUrl(slug: string, applyUrl?: string | null) {
  return curatedApplyUrlBySlug[slug] ?? applyUrl ?? undefined;
}
