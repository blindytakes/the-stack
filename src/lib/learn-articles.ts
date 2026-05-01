export type LearnArticleSeries = 'Evergreen Assets' | 'Core Playbooks';

export type LearnArticleImage = {
  src: string;
  alt: string;
  position?: string;
  attribution?: {
    name: string;
    href: string;
  };
};

export type LearnArticle = {
  title: string;
  category: string;
  readTime: string;
  description: string;
  series?: LearnArticleSeries;
  featuredOrder?: number;
  publishedAt: string;
  author?: string;
  keyTakeaway?: string;
  coverImage?: LearnArticleImage;
  sections: { heading: string; body: string }[];
};

export const learnArticles: Record<string, LearnArticle> = {
  'why-sign-up-bonuses-matter-more-than-everything-else-combined': {
    title: 'Why Sign-Up Bonuses Matter More Than Everything Else Combined',
    category: 'Strategy',
    readTime: '7 min',
    series: 'Evergreen Assets',
    featuredOrder: 1,
    publishedAt: '2026-03-01',
    keyTakeaway: 'A single welcome offer can be worth years of everyday category optimization.',
    coverImage: {
      src: '/blog/covers/why-sign-up-bonuses-matter-more-than-everything-else-combined.jpg',
      alt: 'Passport and travel planner resting on a world map.',
      position: 'center 38%',
      attribution: {
        name: 'Nataliya Vaitkevich / Pexels',
        href: 'https://www.pexels.com/photo/passport-on-top-of-a-planner-7235894/'
      }
    },
    description:
      'Category multipliers are nice. Welcome offers are where the real acceleration happens.',
    sections: [
      {
        heading: 'The value gap most people never run',
        body: 'Most people spend months debating whether 2x or 3x points is better in a category, while ignoring the largest value event in the entire card lifecycle: the sign-up bonus. A typical welcome offer can be worth the equivalent of years of ordinary category optimization. That is not hype; it is arithmetic. If one card gives a welcome offer worth roughly $750 and your everyday card earns an extra 1% versus the fallback option, you would need $75,000 of spend just to match that single bonus. Multipliers matter, but they are the slow lane. Bonuses are the jump-start.'
      },
      {
        heading: 'Everyday rewards cannot catch up quickly',
        body: 'Category earnings are incremental by design. They improve your return one purchase at a time, which is useful for long-term efficiency, but they rarely create meaningful short-term movement. Sign-up bonuses compress a large amount of value into a defined window, usually 60 to 120 days. That compression changes the economics of your full strategy: one strong bonus can fund a domestic flight, offset a major annual fee, or build a travel points base you can compound later. If your goal is outsized annual return, you should optimize the highest-leverage variable first.'
      },
      {
        heading: 'Bonuses create optionality, not just points',
        body: 'A large bonus balance gives you options that pure category earning does not. You can redeem for travel, convert to cash-like value, or hold until a specific redemption appears. Optionality has real financial value because it lets you wait for good opportunities instead of forcing a bad redemption. It also lowers pressure to overspend for tiny marginal gains, because your core yield came from a planned welcome offer rather than constant micromanagement. In practical terms, bonuses provide strategic breathing room. They move you from optimization anxiety into deliberate decision-making.'
      },
      {
        heading: 'The safe framework: plan spend first, apply second',
        body: 'The right process is simple: forecast your next 90 days of unavoidable expenses, then choose a card whose minimum spend requirement fits that forecast naturally. Rent, insurance, utilities, planned travel, and recurring household spend are the raw inputs. Do not reverse the order by applying first and scrambling later. If you need to buy things you would not otherwise buy, the bonus is already compromised. Welcome offers only stay high-value when they sit on top of normal cash flow, paid in full every statement period with zero interest charges.'
      },
      {
        heading: 'Why this remains evergreen across market cycles',
        body: 'Issuers change categories, adjust transfer partners, and refresh benefit packages, but one pattern stays durable: banks are willing to pay heavily for new prime customers. That makes sign-up bonuses the most persistent source of excess value in card strategy. The specific best offer changes, yet the underlying playbook does not: qualify responsibly, align spend windows with real expenses, hit requirements cleanly, and stop. If you do only one thing well in the rewards game, do this well. Almost everything else is secondary optimization.'
      }
    ]
  },
  'why-amex-platinum-is-overrated': {
    title: 'Why the Amex Platinum Is Overrated for Most People',
    category: 'Card Reviews',
    readTime: '7 min',
    series: 'Evergreen Assets',
    featuredOrder: 2,
    publishedAt: '2026-02-24',
    keyTakeaway: 'A card can be excellent on paper and still overrated when most users capture only a fraction of the benefit stack.',
    coverImage: {
      src: '/blog/covers/why-amex-platinum-is-overrated.jpg',
      alt: 'Traveler sitting in an airport terminal beside a suitcase.',
      position: 'center 24%',
      attribution: {
        name: 'Kenneth Surillo / Pexels',
        href: 'https://www.pexels.com/photo/stylish-traveler-waiting-in-airport-lobby-32176091/'
      }
    },
    description:
      'Great for a narrow profile, expensive for everyone else. The mismatch is the problem.',
    sections: [
      {
        heading: 'Prestige is not the same as net value',
        body: 'The Platinum card wins on perception: premium branding, heavy marketing, and a long benefit list that looks unbeatable at first glance. But perception is not portfolio math. Most households do not extract enough reliable annual value to justify a premium fee card with this much breakage risk. A card can be excellent on paper and still be overrated in practice when the median user captures only a fraction of the advertised benefit stack. The core question is not whether the perks are real. It is whether those perks are naturally used by your lifestyle without behavioral forcing.'
      },
      {
        heading: 'Credits are segmented, not liquid',
        body: 'A major reason the card feels overrated is how benefits are delivered: as fragmented credits with channel, timing, or merchant restrictions. A $200 value delivered as four constrained transactions is not economically identical to $200 of flexible cash. If redemption requires changing where you shop, setting reminders, or buying things you did not need, the realized value drops fast. Many cardholders mentally count 100% of published credits while actually redeeming far less. The gap between theoretical and realized value is where most disappointment happens, and that gap is structural, not user error.'
      },
      {
        heading: 'Lounge access has become a weaker differentiator',
        body: 'Airport lounge access remains useful for frequent flyers, but the experience is less differentiated than it was several years ago. Crowd pressure, guest limitations, and airport-specific quality variance can turn a premium headline perk into an inconsistent convenience. If your home airport has poor lounge coverage or your travel pattern is mostly direct short-haul flights, the utility can be sporadic. In that scenario, assigning a large annual dollar value to lounge access is optimistic. A benefit you use occasionally should be valued occasionally, even if the marketing frame implies universal utility.'
      },
      {
        heading: 'The earn structure is narrow for everyday spend',
        body: 'For many users, the Platinum card is not an efficient daily driver. Its strongest earning multipliers are concentrated in travel channels, while everyday categories such as groceries, gas, and general purchases are often better served by other products. That creates a two-card or three-card management burden just to maintain competitive baseline returns. If a premium card requires multiple companions to avoid weak everyday economics, it should be evaluated as one component in a system, not as a standalone winner. Most people buy it as the latter and then underperform.'
      },
      {
        heading: 'Who should still get it',
        body: 'The card is not bad; it is simply over-prescribed. It can be excellent for high-frequency travelers who can naturally use the credits, value elite travel perks, and already spend heavily in qualifying channels. It is usually weaker for occasional travelers chasing status optics. A better framework is to treat Platinum as a specialized tool, not a universal recommendation. If your real habits fit the tool, keep it. If you need a spreadsheet and twelve reminders just to break even, that is your answer.'
      }
    ]
  },
  'why-chase-sapphire-reserve-is-losing-its-shine': {
    title: 'Why Chase Sapphire Reserve Is Losing Its Shine',
    category: 'Card Reviews',
    readTime: '7 min',
    series: 'Evergreen Assets',
    featuredOrder: 3,
    publishedAt: '2026-02-17',
    keyTakeaway: 'Legacy reputation is doing most of the work. The competitive landscape has changed faster than most assumptions.',
    coverImage: {
      src: '/blog/covers/why-chase-sapphire-reserve-is-losing-its-shine.jpg',
      alt: 'Solo traveler seated in a quiet airport lounge.',
      position: 'center 56%',
      attribution: {
        name: 'Sam Tan / Pexels',
        href: 'https://www.pexels.com/photo/a-man-with-a-suitcase-sitting-alone-at-an-airport-17947934/'
      }
    },
    description:
      'Still a strong card, but no longer the automatic premium default it once was.',
    sections: [
      {
        heading: 'From category king to one option among many',
        body: 'The Sapphire Reserve once stood out because it combined strong travel protections, broad utility, and relatively straightforward premium economics. That edge has narrowed as competitors improved earn rates, launched stronger welcome offers, and added richer transfer ecosystems. The card is still good, but the market around it changed faster than most cardholders updated their assumptions. Legacy reputation now does a lot of the work. When people call it a no-brainer in 2026, they are often repeating a verdict from an earlier competitive era, not reflecting current opportunity cost.'
      },
      {
        heading: 'Annual fee pressure is harder to ignore now',
        body: 'Premium annual fees always demand clear offset logic, but the tolerance for fuzzy value has declined as households focus on net return. A large travel credit helps, yet beyond that anchor the remaining economics depend on usage patterns that are less universal than they appear. If your redemptions are basic and your travel cadence is moderate, the fee burden can creep back into the equation faster than expected. A premium card should feel obviously accretive year after year. For many users, Reserve now feels merely acceptable unless they are highly engaged optimizers.'
      },
      {
        heading: 'Redemption advantage is less exclusive',
        body: 'One of Reserve\'s historical advantages was elevated redemption value within the issuer ecosystem. Today, many advanced users prioritize transfer partner redemptions anyway, and competing ecosystems now offer comparable high-end outcomes when used skillfully. If your best redemptions come from transfers rather than fixed portal multipliers, the distinctiveness of any one premium card falls. Reserve still offers solid flexibility, but flexibility alone is no longer rare. The gap between "good redemption tool" and "best long-term anchor" has narrowed, and that is the core reason the card feels less dominant.'
      },
      {
        heading: 'System fit matters more than brand loyalty',
        body: 'The biggest strategic mistake is evaluating premium cards in isolation. The real question is how a card fits with your no-fee earners, your business cards, and your transfer goals. Reserve can still perform well inside a well-designed Chase-heavy setup, but it can underperform if your highest spend categories live elsewhere. As alternatives improve, blind loyalty becomes expensive. The better approach is periodic portfolio re-underwriting: recalculate where your spend happens, where your points are redeemed, and whether the premium fee is still buying a measurable edge.'
      },
      {
        heading: 'What "losing shine" really means',
        body: 'Losing shine does not mean losing relevance. It means the card moved from "automatic recommendation" to "conditional recommendation." For some users, it remains the right premium anchor. For many others, it is now one contender in a deeper field with stronger low-friction value propositions. That distinction matters because old heuristics can lock you into yesterday\'s best setup. The card still deserves a fair hearing. It just no longer wins by default.'
      }
    ]
  },
  'why-capital-one-venture-x-is-the-future-winner': {
    title: 'Why Capital One Venture X Is the Future Winner',
    category: 'Card Reviews',
    readTime: '7 min',
    series: 'Evergreen Assets',
    featuredOrder: 4,
    publishedAt: '2026-02-10',
    keyTakeaway: 'Systems with lower operational friction usually outperform systems with higher theoretical upside.',
    coverImage: {
      src: '/blog/covers/why-capital-one-venture-x-is-the-future-winner.jpg',
      alt: 'Traveler working on a laptop in an airport lounge.',
      position: 'center 36%',
      attribution: {
        name: 'Kelly / Pexels',
        href: 'https://www.pexels.com/photo/business-traveler-working-with-laptop-in-airport-lounge-33621991/'
      }
    },
    description:
      'Its advantage is not hype. It is repeatable, low-friction value at portfolio scale.',
    sections: [
      {
        heading: 'The winning model: high value with low maintenance',
        body: 'The Venture X thesis is simple: deliver premium-tier utility without requiring premium-tier effort. That matters more than most people realize. Complex cards often look superior in spreadsheet mode, then underperform in real life because users miss credits, split spend inefficiently, or abandon optimization routines. Venture X has positioned itself around durable ease: a strong base earn rate, usable travel value, and benefits that do not require a dozen monthly behaviors. In the long run, systems with lower operational friction usually outperform systems with higher theoretical upside and lower execution consistency.'
      },
      {
        heading: 'It works unusually well as a portfolio anchor',
        body: 'Many premium cards are strongest only when heavily paired with multiple ecosystem companions. Venture X can still pair well, but it does not depend on complex stacking to stay competitive. A simple two-card setup can already generate robust returns: use category-optimized earners where obvious, then route all uncategorized spend to Venture X for stable baseline accumulation. That creates a cleaner default path for busy users and reduces reward leakage from accidental 1x spend. Cards that become "easy defaults" tend to win share over time because they match how people actually spend.'
      },
      {
        heading: 'Ecosystem quality is now good enough to compound',
        body: 'Capital One\'s ecosystem is no longer a niche side option. Transfer partners are broad enough for serious redemptions, and the travel experience has improved enough to serve mainstream users who want one integrated path. You do not need an ecosystem to be perfect; you need it to be reliably useful across many scenarios. Once that threshold is crossed, ease and consistency become decisive. Venture X benefits from this dynamic because it sits at the center of a maturing stack that increasingly supports both casual and advanced strategies.'
      },
      {
        heading: 'The economics are psychologically resilient',
        body: 'A card can be mathematically positive and still feel bad if value realization is brittle. Venture X tends to avoid that problem by keeping the annual value logic more legible for the median user. When cardholders can clearly explain why they keep a card in one sentence, retention quality improves. Better retention often leads to stronger product investment loops, which further improves competitiveness. This is an underrated flywheel: understandable value attracts disciplined users, disciplined users keep the product healthy, and product health supports future benefits.'
      },
      {
        heading: 'What could break the "future winner" case',
        body: 'No thesis is permanent. This view weakens if benefits become fragmented, annual economics deteriorate, or competitor products deliver meaningfully better low-friction value. But under current dynamics, Venture X is well aligned with where consumer behavior is moving: fewer moving parts, higher baseline returns, and benefits that are actually usable. The most likely long-term winners in rewards are not the flashiest cards. They are the cards people can run well every year without turning points into a second job.'
      }
    ]
  },
  'why-return-protection-is-the-secret-you-need-now': {
    title: 'Why Return Protection Is the Secret Benefit You Need Now',
    category: 'Benefits',
    readTime: '6 min',
    series: 'Evergreen Assets',
    featuredOrder: 5,
    publishedAt: '2026-02-03',
    keyTakeaway: 'The best rewards strategy is not just about earning more. It is about losing less.',
    coverImage: {
      src: '/blog/covers/why-return-protection-is-the-secret-you-need-now.jpg',
      alt: 'Customer signing for a delivered package at a front door.',
      position: 'center 24%',
      attribution: {
        name: 'Lil_ Gary Ramirez / Pexels',
        href: 'https://www.pexels.com/photo/friendly-package-delivery-at-doorstep-33530406/'
      }
    },
    description:
      'When return windows fail you, this overlooked protection can quietly save real money.',
    sections: [
      {
        heading: 'The hidden inflation hedge for uncertain purchases',
        body: 'Prices are higher, return policies are tighter, and more merchants are shortening windows or adding exclusions. That makes purchase regret more expensive than it used to be. Return protection is the quiet counterweight: when a merchant denies an eligible return, your card benefit may reimburse you up to a limit. In volatile pricing environments, this is not a niche perk. It is practical downside control. You can buy with less fear of being stuck, especially for seasonal items, gifts, or products where fit and quality are hard to evaluate from a product page.'
      },
      {
        heading: 'How return protection differs from other protections',
        body: 'Many people confuse return protection with purchase protection or extended warranty, but they solve different problems. Purchase protection usually covers theft or accidental damage shortly after purchase. Extended warranty stretches manufacturer coverage for defects. Return protection addresses a specific friction point: the item is still functional, but the store refuses a return within your card\'s eligible claim window. That distinction matters because it fills the exact gap where consumers often lose money. Knowing which benefit does what helps you choose the right card at checkout instead of hoping any protection will apply later.'
      },
      {
        heading: 'Where it creates the most real-world value',
        body: 'Return protection shines in categories with high preference risk: apparel sizing, home goods, electronics accessories, gifts, and niche purchases where product descriptions can mislead. It is also useful when buying from stores with stricter final-sale language or complicated holiday return rules. The key is intentional card selection. If you have multiple cards, route uncertain purchases to the card with the strongest return protection terms and claim limits, even if the points multiplier is slightly lower. A one-point earn-rate difference is trivial compared with losing the full purchase amount.'
      },
      {
        heading: 'A claim process that actually works',
        body: 'Most failed claims are documentation failures, not eligibility failures. Keep the receipt, keep proof of payment, save the merchant return denial, and file promptly within the stated timeline. Photograph the item if requested and follow shipping instructions exactly if the benefit administrator asks for return of the product. Build a simple folder in your notes app or cloud drive for uncertain purchases so evidence is ready. This turns a frustrating process into a repeatable workflow. The benefit is only powerful when execution is clean and fast.'
      },
      {
        heading: 'Why this should influence your card stack today',
        body: 'Return protection is rarely highlighted in flashy marketing, which is exactly why it is undervalued. It does not create social proof like lounge photos or metal card aesthetics, but it can prevent immediate cash losses in everyday life. In a practical card strategy, this benefit deserves a dedicated role: one card for uncertain retail purchases, another for category-maximizing routine spend, and separate cards for bonuses when needed. That structure improves both upside and downside management. The best rewards strategy is not just about earning more. It is about losing less.'
      }
    ]
  },
  'how-credit-card-rewards-actually-work': {
    title: 'How Credit Card Rewards Actually Work',
    category: 'Fundamentals',
    readTime: '6 min',
    publishedAt: '2026-01-27',
    coverImage: {
      src: '/blog/covers/how-credit-card-rewards-actually-work.jpg',
      alt: 'Hand pulling a credit card from a wallet beside a laptop.',
      position: 'center 44%',
      attribution: {
        name: 'Sora Shimazaki / Pexels',
        href: 'https://www.pexels.com/photo/credit-card-in-wallet-and-laptop-on-desk-5926243/'
      }
    },
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
    publishedAt: '2026-01-20',
    coverImage: {
      src: '/blog/covers/annual-fee-math.jpg',
      alt: 'Receipts, a calculator, and notes spread across a desk.',
      position: 'center 42%',
      attribution: {
        name: 'Kaboompics.com / Pexels',
        href: 'https://www.pexels.com/photo/hands-holding-receipt-and-notes-5900135/'
      }
    },
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
    publishedAt: '2026-01-13',
    coverImage: {
      src: '/blog/covers/first-card-playbook.jpg',
      alt: 'Young student working on a laptop in a study hall.',
      position: 'center 28%',
      attribution: {
        name: 'Andrea Piacquadio / Pexels',
        href: 'https://www.pexels.com/photo/concentrated-young-student-using-laptop-3932570/'
      }
    },
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
        body: 'Once you have 12+ months of history and a score above 670, you can start looking at real rewards cards. Use the Personalized Bonus Plan to see what matches your profile — your spend patterns, fee tolerance, and credit tier will determine which cards make sense. Don\'t close your first card when you upgrade — the age of your oldest account matters for your score. Just sock-drawer it or use it for one small recurring charge.'
      }
    ]
  },
  'signup-bonus-strategy': {
    title: 'How to Maximize Sign-Up Bonuses Without Gaming the System',
    category: 'Strategy',
    readTime: '5 min',
    publishedAt: '2026-01-06',
    coverImage: {
      src: '/blog/covers/signup-bonus-strategy.jpg',
      alt: 'Small globe resting on luggage beside a passport.',
      position: 'center 56%',
      attribution: {
        name: 'Tima Miroshnichenko / Pexels',
        href: 'https://www.pexels.com/photo/globe-beside-a-passport-7009465/'
      }
    },
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
  'bank-account-bonuses-101': {
    title: 'Bank Account Bonuses 101: How to Actually Keep the Money',
    category: 'Banking',
    readTime: '6 min',
    publishedAt: '2026-02-14',
    coverImage: {
      src: '/blog/covers/bank-account-bonuses-101.jpg',
      alt: 'Phone calculator over cash and a notebook on a desk.',
      position: 'center 38%',
      attribution: {
        name: 'Jakub Zerdzicki / Pexels',
        href: 'https://www.pexels.com/photo/person-using-smartphone-calculator-with-money-on-desk-35028998/'
      }
    },
    description:
      'Checking and savings bonuses can be high-value, but only if you avoid fee clawbacks and missed requirements.',
    sections: [
      {
        heading: 'Why banks pay signup bonuses',
        body: 'Banks are buying deposits and customer relationships. A checking bonus or savings bonus is marketing spend in exchange for your direct deposit, minimum balance, or account activity. If you can meet those requirements without distorting your normal money flow, these offers can be one of the highest hourly-rate moves in personal finance.'
      },
      {
        heading: 'Read the requirement stack, not just the headline',
        body: 'A headline like "$400 checking bonus" usually hides a stack of conditions: a direct deposit threshold, a timeline, debit card transactions, and a minimum account open period. Missing one condition can forfeit the bonus. Before opening anything, list every requirement with dates, then decide if your current cash flow can satisfy them naturally.'
      },
      {
        heading: 'Watch the fee and clawback traps',
        body: 'A bonus loses value fast if monthly fees, overdraft incidents, or early closure penalties eat into it. Many accounts waive maintenance fees only if you keep a minimum balance or qualifying direct deposit. Calculate net value, not gross bonus: bonus value minus all account costs and taxes.'
      },
      {
        heading: 'Build a simple tracking system',
        body: 'Use a basic tracker with five fields: account name, open date, requirement deadlines, expected payout date, and close-safe date. Add reminders one week before each deadline. Most bonus failures are not math problems; they are execution problems caused by forgotten dates.'
      },
      {
        heading: 'How this fits a wider payout strategy',
        body: 'Bank bonuses work best when paired with card strategy, not as a separate project. Use cards for spend-based rewards and welcome offers, and use deposit accounts for direct-deposit and cash-balance incentives. The goal is one coordinated system that raises annual net value without adding debt risk.'
      }
    ]
  },
  'travel-vs-cashback': {
    title: 'Travel Points vs Cash Back: Which Is Actually Better?',
    category: 'Comparison',
    readTime: '8 min',
    publishedAt: '2026-02-21',
    coverImage: {
      src: '/blog/covers/travel-vs-cashback.jpg',
      alt: 'Person holding a credit card in one hand and cash in the other.',
      position: 'center 28%',
      attribution: {
        name: 'Sora Shimazaki / Pexels',
        href: 'https://www.pexels.com/photo/a-man-holding-a-bank-card-and-dollar-bills-5926251/'
      }
    },
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
        body: 'The best card for you is the one that returns the most value given your actual spending patterns — not the one with the flashiest marketing. Use the Personalized Bonus Plan to compare options side by side, and use Card vs Card to see the real differences in rewards, fees, and benefits for any two cards you\'re considering.'
      }
    ]
  },
  'credit-score-myths': {
    title: '5 Credit Score Myths That Cost You Money',
    category: 'Fundamentals',
    readTime: '4 min',
    publishedAt: '2026-01-30',
    coverImage: {
      src: '/blog/covers/credit-score-myths.jpg',
      alt: 'Receipts and a calculator laid out on top of financial paperwork.',
      position: 'center 34%',
      attribution: {
        name: 'Kaboompics.com / Pexels',
        href: 'https://www.pexels.com/photo/person-holding-receipts-and-using-a-calculator-7680736/'
      }
    },
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

export const learnCategoryColor: Record<string, string> = {
  Fundamentals: 'text-brand-teal',
  Strategy: 'text-brand-gold',
  'Getting Started': 'text-brand-coral',
  Comparison: 'text-text-secondary',
  Banking: 'text-brand-teal',
  'Card Reviews': 'text-brand-coral',
  Benefits: 'text-brand-gold'
};

export type LearnArticleCard = {
  slug: string;
  title: string;
  cardTitle: string;
  category: string;
  readTime: string;
  description: string;
  series: LearnArticleSeries;
  featuredOrder: number | null;
  publishedAt: string;
  author: string;
  keyTakeaway: string | null;
  coverImage: LearnArticleImage | null;
};

function getArticleSeries(article: LearnArticle): LearnArticleSeries {
  return article.series ?? 'Core Playbooks';
}

const articleCardTitles: Record<string, string> = {
  'why-sign-up-bonuses-matter-more-than-everything-else-combined':
    'Why Sign-Up Bonuses Matter Most',
  'why-amex-platinum-is-overrated':
    'Amex Platinum: Overrated for Most',
  'why-chase-sapphire-reserve-is-losing-its-shine':
    'Sapphire Reserve Is Losing Its Shine',
  'why-capital-one-venture-x-is-the-future-winner':
    'Why Venture X Keeps Winning',
  'why-return-protection-is-the-secret-you-need-now':
    'Return Protection Is Underrated',
  'how-credit-card-rewards-actually-work':
    'How Card Rewards Actually Work',
  'annual-fee-math':
    'Annual Fee Math, Made Simple',
  'first-card-playbook':
    'Your First Credit Card Playbook',
  'signup-bonus-strategy':
    'Maximize Bonuses Without the Games',
  'bank-account-bonuses-101':
    'Bank Bonuses 101',
  'travel-vs-cashback':
    'Travel Points vs. Cash Back',
  'credit-score-myths':
    'Credit Score Myths That Cost You'
};

const allLearnArticleCards: LearnArticleCard[] = Object.entries(learnArticles).map(
  ([slug, article]) => ({
    slug,
    title: article.title,
    cardTitle: articleCardTitles[slug] ?? article.title,
    category: article.category,
    readTime: article.readTime,
    description: article.description,
    series: getArticleSeries(article),
    featuredOrder: article.featuredOrder ?? null,
    publishedAt: article.publishedAt,
    author: article.author ?? 'The Stack',
    keyTakeaway: article.keyTakeaway ?? null,
    coverImage: article.coverImage ?? null
  })
);

const evergreenSortMax = Number.MAX_SAFE_INTEGER;

export const evergreenAssetArticles = allLearnArticleCards
  .filter((article) => article.series === 'Evergreen Assets')
  .sort(
    (a, b) =>
      (a.featuredOrder ?? evergreenSortMax) - (b.featuredOrder ?? evergreenSortMax)
  );

export const corePlaybookArticles = allLearnArticleCards.filter(
  (article) => article.series === 'Core Playbooks'
);

export const allBlogArticles = allLearnArticleCards;
export const allBlogSlugs = allBlogArticles.map((article) => article.slug);
export const evergreenAssetSlugs = evergreenAssetArticles.map((article) => article.slug);
export const corePlaybookSlugs = corePlaybookArticles.map((article) => article.slug);

export function getArticleBySlug(slug: string): LearnArticle | null {
  return learnArticles[slug] ?? null;
}

export function getArticleBySlugAndSeries(
  slug: string,
  series: LearnArticleSeries
): LearnArticle | null {
  const article = learnArticles[slug];
  if (!article) return null;
  return getArticleSeries(article) === series ? article : null;
}

export function formatArticleDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export const allBlogArticlesByDate = [...allLearnArticleCards].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
);
