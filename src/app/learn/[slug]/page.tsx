import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

/* ── Article content ────────────────────────────────────── */

type Article = {
  title: string;
  category: string;
  readTime: string;
  description: string;
  sections: { heading: string; body: string }[];
};

const articles: Record<string, Article> = {
  'how-credit-card-rewards-actually-work': {
    title: 'How Credit Card Rewards Actually Work',
    category: 'Fundamentals',
    readTime: '6 min',
    description:
      'Points, miles, and cash back sound simple — until you try to use them.',
    sections: [
      {
        heading: 'The basics: three reward currencies',
        body: 'Every credit card reward boils down to one of three types: cash back, points, or miles. Cash back is the simplest — you earn a percentage of every purchase returned as a statement credit or deposit. Points and miles are more abstract: they\'re currencies issued by banks or airlines that can be redeemed for travel, gift cards, or transferred to partners. The key difference is that points and miles have variable value depending on how you redeem them.'
      },
      {
        heading: 'Earn rates aren\'t what they seem',
        body: 'When a card advertises "3x points on dining," that sounds straightforward. But the value of 3x depends entirely on what a point is worth. One bank\'s point might be worth 1 cent; another\'s might be worth 2 cents when transferred to an airline partner. So "3x" on one card can be worth less than "2x" on another. Always look at the effective return rate — the actual dollar value you get back per dollar spent — not just the multiplier.'
      },
      {
        heading: 'Redemption is where value is made or lost',
        body: 'The biggest mistake people make with rewards is earning efficiently but redeeming poorly. Booking travel through a bank\'s portal might get you 1 cent per point. Transferring those same points to an airline partner and booking a business class seat might get you 3-5 cents per point. Cash back avoids this complexity entirely, which is why it\'s often the best choice for people who don\'t want to optimize redemptions.'
      },
      {
        heading: 'Category bonuses and their limitations',
        body: 'Most cards offer bonus earn rates on specific spending categories — dining, groceries, travel, gas. Some rotate categories quarterly, others are fixed. The catch: bonus categories often have spending caps. A card might offer 5% on groceries, but only on the first $1,500 per quarter. After that, it drops to 1%. If you\'re a heavy spender in a category, check the caps before assuming a card is your best option.'
      },
      {
        heading: 'The bottom line',
        body: 'Rewards programs want you to earn points and forget about them, or redeem them for low-value options. The system works in your favor when you understand the earn rates, compare effective return rates across cards, and redeem strategically. Or just use a flat-rate cash back card and skip the optimization game entirely. Both are valid strategies.'
      }
    ]
  },
  'annual-fee-math': {
    title: 'The Annual Fee Math Most People Get Wrong',
    category: 'Strategy',
    readTime: '5 min',
    description:
      'A $550 card can cost less than a $0 card if the benefits offset the fee.',
    sections: [
      {
        heading: 'The reflex: "I don\'t want to pay a fee"',
        body: 'Most people default to no-annual-fee cards because paying money to have a credit card feels wrong. It\'s intuitive — why pay $95 or $550 for something you can get for free? But this logic ignores the other side of the equation: what the card gives you back. A $95 card that offers $300 in annual travel credits and better earn rates might save you hundreds more than a $0 card with thin rewards.'
      },
      {
        heading: 'How to calculate net cost',
        body: 'Net cost = Annual fee minus the value of benefits you\'ll actually use. This is the critical distinction — benefits you\'ll actually use, not benefits that exist on paper. A $300 airline credit is worth $300 if you fly regularly. It\'s worth $0 if you don\'t. A lounge access benefit is worth hundreds if you have layovers frequently, or nothing if you drive everywhere. Be honest about your habits when running this math.'
      },
      {
        heading: 'The breakeven calculation',
        body: 'Compare the net cost of a fee card against the opportunity cost of using a free card. If a $95-fee card earns 3% on dining and a $0 card earns 1.5%, the fee card earns an extra 1.5 cents per dollar on dining. You\'d need to spend about $6,333 on dining annually ($528/month) just to break even on the fee from the earn rate difference alone. If your dining spend is lower than that, the free card wins on earn rates — though benefits might still tip the balance.'
      },
      {
        heading: 'When free cards actually win',
        body: 'No-fee cards win when your spending is moderate, you don\'t travel much, you prefer simplicity, or the fee card\'s benefits don\'t match your lifestyle. There\'s no shame in a 2% flat cash back card with no fee — it\'s one of the most efficient setups possible for the average person. The math doesn\'t lie: a card you use optimally beats a premium card you underuse.'
      }
    ]
  },
  'first-card-playbook': {
    title: 'Your First Credit Card: A No-Nonsense Playbook',
    category: 'Getting Started',
    readTime: '7 min',
    description: 'Building credit from scratch? Here\'s exactly what to look for.',
    sections: [
      {
        heading: 'Step 1: Know where you stand',
        body: 'If you have no credit history, you\'re not starting with a "bad" score — you\'re starting with no score. That\'s an important distinction. Lenders can\'t assess your risk because there\'s no data. Your first card will likely be a student card, a secured card (where you put down a deposit), or a basic starter card from your bank. Don\'t apply for premium cards — you\'ll get denied, and the hard inquiry will sit on your report for two years.'
      },
      {
        heading: 'Step 2: Pick the right starter card',
        body: 'Look for three things: no annual fee (you don\'t need to pay to build credit), reports to all three bureaus (Equifax, Experian, TransUnion), and a realistic approval requirement. Student cards are ideal if you\'re in school. Secured cards are the backup — you put down $200-500 as collateral, use the card normally, and get your deposit back after 6-12 months of good behavior. Some secured cards even earn rewards.'
      },
      {
        heading: 'Step 3: Use it correctly',
        body: 'The rules are simple but non-negotiable. Use the card for small, regular purchases you\'d make anyway — groceries, gas, a subscription. Pay the full statement balance every month, on time, no exceptions. Carrying a balance does not help your credit score — that\'s a myth. It just costs you interest. Keep utilization below 30% of your limit, but lower is better. Set up autopay for the full balance so you never miss a payment.'
      },
      {
        heading: 'Step 4: Be patient',
        body: 'Credit building takes time. After 6-12 months of consistent, responsible use, your score will start to take shape. After a year, you\'ll likely qualify for better cards with actual rewards. Don\'t apply for multiple cards at once — each application is a hard inquiry, and too many in a short period signals desperation to lenders. One card, used well, for a year. That\'s the playbook.'
      },
      {
        heading: 'Step 5: Graduate up',
        body: 'Once you have 12+ months of history and a score above 670, you can start looking at real rewards cards. Use the Card Finder to see what matches your profile — your spend patterns, fee tolerance, and credit tier will determine which cards make sense. Don\'t close your first card when you upgrade — the age of your oldest account matters for your score. Just sock-drawer it or use it for one small recurring charge.'
      }
    ]
  },
  'signup-bonus-strategy': {
    title: 'How to Maximize Sign-Up Bonuses Without Gaming the System',
    category: 'Strategy',
    readTime: '5 min',
    description: 'Time your applications and meet spend requirements with normal purchases.',
    sections: [
      {
        heading: 'What sign-up bonuses actually are',
        body: 'Sign-up bonuses (also called welcome offers) are the single most valuable thing about credit cards. A typical offer looks like: "Earn 60,000 points after spending $4,000 in the first 3 months." Those 60,000 points might be worth $600-1,200 depending on how you redeem them. No amount of everyday spending at 2-3% back will match that value in the same timeframe.'
      },
      {
        heading: 'Timing your applications',
        body: 'Apply when you have predictable large expenses coming up — a move, holiday shopping, insurance premiums, tax payments (some processors accept credit cards), or a home project. The goal is to meet the minimum spend with purchases you\'d make anyway, not to manufacture spending. If the requirement is $4,000 in 3 months, that\'s about $1,333/month. Check whether that\'s realistic for your budget before you apply.'
      },
      {
        heading: 'Meeting the spend requirement',
        body: 'Route all your normal spending through the new card during the bonus period — groceries, gas, subscriptions, bills. Prepay utilities or insurance if allowed. Buy gift cards for stores you frequent (but only for amounts you\'ll actually use). Don\'t buy things you don\'t need to hit the threshold. If you can\'t hit it organically, the card isn\'t right for you right now. Wait for a better time.'
      },
      {
        heading: 'Stacking bonuses across cards',
        body: 'Over time, you can earn multiple sign-up bonuses by spacing applications 3-6 months apart. Each new card builds your credit line and, if managed well, doesn\'t hurt your score significantly. The key is discipline: never carry a balance, always track your spend deadlines, and don\'t open cards you won\'t use long-term. A bonus is worthless if the card charges a fee you\'ll never offset.'
      }
    ]
  },
  'travel-vs-cashback': {
    title: 'Travel Points vs Cash Back: Which Is Actually Better?',
    category: 'Comparison',
    readTime: '8 min',
    description: 'The answer depends on how you spend, how you redeem, and your complexity tolerance.',
    sections: [
      {
        heading: 'The simple answer',
        body: 'Cash back is better for most people. It\'s straightforward, there\'s no devaluation risk, and you don\'t need to learn transfer partner charts or booking strategies. A 2% flat cash back card gives you exactly 2 cents per dollar, every time, no guessing. If you value simplicity and certainty, cash back wins.'
      },
      {
        heading: 'When travel points pull ahead',
        body: 'Points become more valuable when you\'re willing to be flexible with travel and learn the redemption system. Transferring points to airline partners for premium cabin flights can yield 3-5 cents per point — significantly more than cash back. If you travel internationally, fly business/first class, or stay at hotels frequently, points programs can deliver outsized value. But only if you actually redeem them well.'
      },
      {
        heading: 'The hidden cost of points',
        body: 'Points have costs that cash back doesn\'t. They require time to learn and optimize. They can be devalued by the issuer at any time — a point worth 2 cents today might be worth 1.5 cents next year. They lock you into specific ecosystems. And they tempt you to spend on travel you wouldn\'t otherwise take just to "use your points." Cash back has none of these downsides.'
      },
      {
        heading: 'The hybrid approach',
        body: 'Many experienced cardholders use both: a points card for travel spending (where the multipliers are highest) and a flat cash back card for everything else. This captures the best of both systems without over-committing to either. If you\'re just starting out, begin with cash back. Once your spending is consistent and you\'re comfortable with the basics, explore whether a points card adds value for your specific travel patterns.'
      },
      {
        heading: 'Run your own numbers',
        body: 'The best card for you is the one that returns the most value given your actual spending patterns — not the one with the flashiest marketing. Use the Card Finder to compare options side by side, and use Card vs Card to see the real differences in rewards, fees, and benefits for any two cards you\'re considering.'
      }
    ]
  },
  'credit-score-myths': {
    title: '5 Credit Score Myths That Cost You Money',
    category: 'Fundamentals',
    readTime: '4 min',
    description: 'What actually matters for your credit score — and what doesn\'t.',
    sections: [
      {
        heading: 'Myth 1: Carrying a balance helps your score',
        body: 'This is the most expensive myth in personal finance. Your credit score does not improve by carrying a balance and paying interest. Payment history and utilization ratio are what matter. Pay your full statement balance every month. Carrying a balance just costs you interest — typically 20-30% APR — and does nothing positive for your score.'
      },
      {
        heading: 'Myth 2: Checking your score hurts it',
        body: 'Checking your own credit score is a "soft inquiry" and has zero impact on your score. You can check it daily if you want. What does cause a small, temporary dip is a "hard inquiry" — when a lender pulls your credit because you applied for a new account. Even then, the impact is minor (5-10 points) and fades within a few months.'
      },
      {
        heading: 'Myth 3: Closing old cards improves your credit',
        body: 'The opposite is true. Closing an old card reduces your total available credit (raising your utilization ratio) and can shorten your average account age — both negative signals. If an old card has no annual fee, keep it open even if you don\'t use it. Put a small recurring charge on it to keep it active, and let it age gracefully.'
      },
      {
        heading: 'Myth 4: You need to be debt-free to have good credit',
        body: 'Having debt doesn\'t automatically mean bad credit. What matters is how you manage it. A mortgage, student loan, or car loan paid on time every month is a positive signal. Lenders want to see that you can handle different types of credit responsibly. The mix of credit types actually accounts for about 10% of your score.'
      },
      {
        heading: 'Myth 5: All credit scores are the same',
        body: 'You don\'t have one credit score — you have dozens. FICO and VantageScore are different scoring models, each with multiple versions. Different lenders use different versions. The score your bank shows you might not be the score a card issuer uses to evaluate your application. Don\'t obsess over a specific number. Focus on the behaviors that improve all scores: pay on time, keep utilization low, don\'t apply for too much credit at once, and let your accounts age.'
      }
    ]
  }
};

/* ── Page ────────────────────────────────────────────────── */

export function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) return { title: 'Article Not Found' };
  return { title: article.title, description: article.description };
}

const categoryColor: Record<string, string> = {
  Fundamentals: 'text-brand-teal',
  Strategy: 'text-brand-gold',
  'Getting Started': 'text-brand-coral',
  Comparison: 'text-text-secondary'
};

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) notFound();

  return (
    <div className="container-page pt-12 pb-16">
      <nav className="mb-8 text-sm text-text-muted">
        <Link href="/learn" className="transition hover:text-text-secondary">
          Learn
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{article.title}</span>
      </nav>

      <header className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs uppercase tracking-[0.2em] ${categoryColor[article.category] ?? 'text-text-muted'}`}
          >
            {article.category}
          </span>
          <span className="text-xs text-text-muted">{article.readTime} read</span>
        </div>
        <h1 className="mt-3 font-[var(--font-heading)] text-4xl leading-tight text-text-primary">
          {article.title}
        </h1>
        <p className="mt-4 text-lg text-text-secondary">{article.description}</p>
      </header>

      <article className="mt-12 max-w-2xl space-y-10">
        {article.sections.map((section, i) => (
          <section key={i}>
            <h2 className="font-[var(--font-heading)] text-2xl text-text-primary">
              {section.heading}
            </h2>
            <p className="mt-3 leading-relaxed text-text-secondary">{section.body}</p>
          </section>
        ))}
      </article>

      <div className="mt-16 max-w-2xl rounded-2xl border border-white/10 bg-bg-surface p-6">
        <p className="text-sm text-text-muted">
          Want to find the right card for your situation?{' '}
          <Link href="/tools/card-finder" className="text-brand-teal transition hover:underline">
            Try the Card Finder
          </Link>{' '}
          or{' '}
          <Link href="/tools/card-vs-card" className="text-brand-teal transition hover:underline">
            compare two cards head-to-head
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
