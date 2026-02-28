import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Playbooks on credit card strategy, timing, and maximizing value.'
};

const articles = [
  {
    slug: 'how-credit-card-rewards-actually-work',
    title: 'How Credit Card Rewards Actually Work',
    description:
      'Points, miles, and cash back sound simple — until you try to use them. Here\'s how reward programs really operate behind the scenes.',
    category: 'Fundamentals',
    readTime: '6 min'
  },
  {
    slug: 'annual-fee-math',
    title: 'The Annual Fee Math Most People Get Wrong',
    description:
      'A $550 card can cost less than a $0 card if the benefits offset the fee. Here\'s how to calculate whether a fee is actually worth it.',
    category: 'Strategy',
    readTime: '5 min'
  },
  {
    slug: 'first-card-playbook',
    title: 'Your First Credit Card: A No-Nonsense Playbook',
    description:
      'Building credit from scratch? Skip the noise. Here\'s exactly what to look for, what to avoid, and when to apply.',
    category: 'Getting Started',
    readTime: '7 min'
  },
  {
    slug: 'signup-bonus-strategy',
    title: 'How to Maximize Sign-Up Bonuses Without Gaming the System',
    description:
      'Time your applications, meet spend requirements with normal purchases, and stack bonuses across cards — the right way.',
    category: 'Strategy',
    readTime: '5 min'
  },
  {
    slug: 'travel-vs-cashback',
    title: 'Travel Points vs Cash Back: Which Is Actually Better?',
    description:
      'The answer depends on how you spend, how you redeem, and how much complexity you\'re willing to tolerate. We break down the real math.',
    category: 'Comparison',
    readTime: '8 min'
  },
  {
    slug: 'credit-score-myths',
    title: '5 Credit Score Myths That Cost You Money',
    description:
      'Carrying a balance doesn\'t help your score. Closing old cards can hurt it. Here\'s what actually matters — and what doesn\'t.',
    category: 'Fundamentals',
    readTime: '4 min'
  }
];

const categoryColor: Record<string, string> = {
  Fundamentals: 'text-brand-teal',
  Strategy: 'text-brand-gold',
  'Getting Started': 'text-brand-coral',
  Comparison: 'text-text-secondary'
};

export default function LearnPage() {
  return (
    <div className="container-page pt-12 pb-16">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">Learn</p>
        <h1 className="mt-3 font-[var(--font-heading)] text-4xl text-text-primary">
          Playbooks & Guides
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Clear-headed strategy on credit cards — no affiliate bait, no filler. Just the stuff
          that actually helps you make better decisions.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className="group rounded-2xl border border-white/10 bg-bg-surface p-6 transition hover:-translate-y-1 hover:border-white/20"
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] uppercase tracking-[0.2em] ${categoryColor[article.category] ?? 'text-text-muted'}`}
              >
                {article.category}
              </span>
              <span className="text-[10px] text-text-muted">{article.readTime}</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-text-primary transition group-hover:text-brand-teal">
              {article.title}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">{article.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
