import { readAllCardSeedDatasets } from '@/lib/card-seed-files';

type CliOptions = {
  issuer?: string;
  slug?: string;
  limit?: number;
};

type CardWithFile = {
  filePath: string;
  slug: string;
  name: string;
  issuer: string;
  applyUrl?: string;
  imageUrl?: string;
};

type ProbeResult = {
  filePath: string;
  slug: string;
  name: string;
  issuer: string;
  applyUrl?: string;
  bestCandidate?: string;
  candidates: string[];
};

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

function usage() {
  console.info(
    'Usage: node --import tsx ./scripts/probe-card-image-candidates.ts [--issuer <issuer>] [--slug <slug>] [--limit <n>]'
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--issuer') {
      options.issuer = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--slug') {
      options.slug = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--limit') {
      const value = Number(argv[index + 1]);
      if (Number.isFinite(value) && value > 0) options.limit = value;
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
  }

  return options;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreCandidate(url: string, card: CardWithFile) {
  const normalizedUrl = url.toLowerCase();
  const normalizedSlugTokens = card.slug.split('-');
  const normalizedNameTokens = normalize(card.name).split(' ');

  let score = 0;

  for (const token of [...normalizedSlugTokens, ...normalizedNameTokens]) {
    if (token.length < 3) continue;
    if (normalizedUrl.includes(token)) score += 3;
  }

  if (/\.(png|webp|jpg|jpeg|svg)(?:$|\?)/.test(normalizedUrl)) score += 2;
  if (normalizedUrl.includes('card')) score += 4;
  if (normalizedUrl.includes('cards')) score += 2;
  if (normalizedUrl.includes('product')) score += 1;
  if (normalizedUrl.includes('marketplace')) score += 1;

  const negativeTokens = [
    'favicon',
    'apple-touch',
    'logo',
    'icon',
    'sprite',
    'background',
    'hero',
    'banner',
    'thumbnail',
    'avatar'
  ];
  for (const token of negativeTokens) {
    if (normalizedUrl.includes(token)) score -= 5;
  }

  return score;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function resolveUrl(url: string, baseUrl: string) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function extractMetaImageCandidates(html: string, pageUrl: string) {
  const regexes = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/gi,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["'][^>]*>/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["'][^>]*>/gi
  ];

  const matches: string[] = [];
  for (const regex of regexes) {
    for (const match of html.matchAll(regex)) {
      const resolved = resolveUrl(match[1] ?? '', pageUrl);
      if (resolved) matches.push(resolved);
    }
  }
  return matches;
}

function extractUrlCandidates(html: string, pageUrl: string) {
  const rawUrls = html.match(/https?:\/\/[^"'()\s<>]+/g) ?? [];
  const filtered = rawUrls.filter((url) =>
    /\.(png|webp|jpg|jpeg|svg)(?:$|\?)/i.test(url)
  );

  const relativeUrls = html.match(/(?:src|href)=["']([^"']+\.(?:png|webp|jpg|jpeg|svg)[^"']*)["']/gi) ?? [];
  const resolvedRelative = relativeUrls
    .map((match) => {
      const capture = match.match(/=["']([^"']+)["']/);
      return resolveUrl(capture?.[1] ?? '', pageUrl);
    })
    .filter((value): value is string => Boolean(value));

  return [...filtered, ...resolvedRelative];
}

async function fetchCandidates(card: CardWithFile): Promise<ProbeResult> {
  if (!card.applyUrl) {
    return {
      filePath: card.filePath,
      slug: card.slug,
      name: card.name,
      issuer: card.issuer,
      candidates: []
    };
  }

  const response = await fetch(card.applyUrl, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml'
    },
    redirect: 'follow'
  });

  const html = await response.text();
  const candidates = unique([
    ...extractMetaImageCandidates(html, card.applyUrl),
    ...extractUrlCandidates(html, card.applyUrl)
  ])
    .filter((candidate) => candidate.startsWith('http'))
    .sort((a, b) => scoreCandidate(b, card) - scoreCandidate(a, card));

  return {
    filePath: card.filePath,
    slug: card.slug,
    name: card.name,
    issuer: card.issuer,
    applyUrl: card.applyUrl,
    bestCandidate: candidates[0],
    candidates: candidates.slice(0, 12)
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const datasets = await readAllCardSeedDatasets();
  let cards: CardWithFile[] = datasets.flatMap((dataset) =>
    dataset.cards.map((card) => ({
      filePath: dataset.filePath,
      slug: card.slug,
      name: card.name,
      issuer: card.issuer,
      applyUrl: card.applyUrl,
      imageUrl: card.imageUrl
    }))
  );

  cards = cards.filter((card) => !card.imageUrl);

  if (options.issuer) {
    const issuer = normalize(options.issuer);
    cards = cards.filter((card) => normalize(card.issuer) === issuer);
  }

  if (options.slug) {
    cards = cards.filter((card) => card.slug === options.slug);
  }

  if (options.limit) {
    cards = cards.slice(0, options.limit);
  }

  const results: ProbeResult[] = [];
  for (const card of cards) {
    results.push(await fetchCandidates(card));
  }

  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error('[probe-card-image-candidates] failed', error);
  process.exit(1);
});
