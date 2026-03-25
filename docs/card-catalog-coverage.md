# Card Catalog Coverage

Last updated: March 25, 2026

## Scope

The working scope for `/cards` is:

- Publicly available U.S. consumer and business rewards cards.
- Airline, hotel, travel, cashback, and general-points products with real user demand.
- Major issuer flagships, meaningful co-brands, and widely used fintech cards.

The main catalog usually excludes:

- Pure balance-transfer and low-APR cards with no rewards angle.
- Secured and most credit-building products.
- Most student cards.
- Private-bank, invite-only, or internal-upgrade-only products.
- Store cards and narrow retail cards.

## Official issuer research used for this pass

- Chase travel cards: [creditcards.chase.com/travel-credit-cards](https://creditcards.chase.com/travel-credit-cards)
- Chase business cards: [creditcards.chase.com/business-credit-cards/chaseforbusiness](https://creditcards.chase.com/business-credit-cards/chaseforbusiness)
- Capital One personal compare: [capitalone.com/credit-cards/compare](https://www.capitalone.com/credit-cards/compare/)
- Capital One small business cards: [capitalone.com/small-business/credit-cards/homepage](https://www.capitalone.com/small-business/credit-cards/homepage/)
- Capital One business cash cards: [capitalone.com/small-business/credit-cards/cash-back](https://www.capitalone.com/small-business/credit-cards/cash-back/)
- American Express business cards: [americanexpress.com/us/credit-cards/business/business-credit-cards](https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/)
- Citi all cards: [citi.com/credit-cards/view-all-credit-cards](https://www.citi.com/credit-cards/view-all-credit-cards)
- Bank of America business cards: [bankofamerica.com/smallbusiness/credit-cards/view-all-small-business-credit-cards](https://www.bankofamerica.com/smallbusiness/credit-cards/view-all-small-business-credit-cards/)
- U.S. Bank business cards and launch materials:
  - [business-triple-cash-back-credit-card](https://www.usbank.com/business-banking/business-credit-cards/business-triple-cash-back-credit-card.html)
  - [business-leverage-rewards-credit-card](https://www.usbank.com/business-banking/business-credit-cards/business-leverage-rewards-credit-card.html)
  - [Business Shield launch](https://www.usbank.com/about-us-bank/news-and-stories/article-library/us-bank-business-shield-visa-offers-intro-zero-percent-apr-for-up-to-18-billing-cycles.html)
- SoFi credit card: [sofi.com/credit-card](https://www.sofi.com/credit-card/)
- PayPal Cashback Mastercard: [paypal.com/us/digital-wallet/manage-money/paypal-cashback-mastercard](https://www.paypal.com/us/digital-wallet/manage-money/paypal-cashback-mastercard)
- Venmo Credit Card: [venmo.com/about/creditcard](https://venmo.com/about/creditcard/)
- Fidelity Rewards Visa Signature: [fidelity.com/spend-save/visa-signature-card](https://www.fidelity.com/spend-save/visa-signature-card?sid=cr010323)

## Added in batch 2

`content/cards-expansion-batch-2.json` adds missing public coverage across:

- Chase United, Southwest, Hyatt, IHG, and Ink business gaps.
- Capital One VentureOne and the missing core Spark business lineup.
- American Express business-card gaps.
- U.S. Bank business rewards gaps.
- Bank of America business rewards gaps.
- Citi AAdvantage and Citi Strata everyday coverage.
- SoFi, PayPal, Fidelity, and Venmo.

## Still not fully covered after this pass

High-signal cards that still likely belong in-scope:

- American Express Delta personal lineup.
- American Express Hilton personal lineup and Marriott personal lineup.
- Chase Amazon/Prime Visa and some airline co-brands like Aeroplan, British Airways, Iberia, and Marriott Bonvoy Bold.
- Additional Citi cards like AAdvantage MileUp and Costco Anywhere.
- Wells Fargo Choice Privileges cards and additional business cards.
- TD, PNC, Alliant, and a few other public cashback issuers.

## Data quality note

This pass prioritizes catalog coverage. Some newly added cards have lighter enrichment than the original core set:

- Fewer benefits and transfer-partner rows.
- Some bonuses intentionally omitted when the official source in this pass did not expose exact spend thresholds cleanly.
- Some apply links point to official issuer category pages rather than deep product pages.
