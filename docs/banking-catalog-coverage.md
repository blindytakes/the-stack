# Banking Catalog Coverage

Last updated: March 25, 2026

## Scope

The working scope for `/banking` is:

- Publicly available U.S. checking, savings, and bundle bonus offers.
- Both personal and business banking offers when the bonus is live and publicly disclosed.
- Major national and high-signal regional banks where the bonus terms are actionable for a broad audience.

The main catalog usually excludes:

- Targeted mailer-only or support-article-only offers without a public application path.
- Offers that appear only through affiliate/referral landing pages and cannot be confirmed from an official bank page.
- Expired or obviously stale promotions.
- Deposit accounts without a bonus, even if the account itself is worth tracking.

## Modeling note

The banking directory can now distinguish `personal` and `business` offers.

The planner also keeps only the strongest eligible offer per bank when building a recommended sequence. That matters because some banks expose multiple bonus-eligible business account variants at once, but those are generally mutually exclusive in practice.

## Official source set used for this pass

- Chase Business Complete bonus:
  [account.chase.com/business/business-checking-offer](https://account.chase.com/business/business-checking-offer)
- U.S. Bank Business Essentials:
  [business-essentials](https://www.usbank.com/business-banking/banking-products/business-bank-accounts/business-checking-account/business-essentials.html)
- U.S. Bank Platinum Business Checking:
  [platinum-business-checking-account-package](https://www.usbank.com/business-banking/banking-products/business-bank-accounts/business-checking-account/platinum-business-checking-account-package.html)
- Wells Fargo business checking bonus:
  [accountoffers.wellsfargo.com/businesscheckinga](https://accountoffers.wellsfargo.com/businesscheckinga/)
- Wells Fargo business account comparison:
  [wellsfargo.com/biz/checking/compare-checking-accounts](https://www.wellsfargo.com/biz/checking/compare-checking-accounts/)
- PNC business checking offers:
  [pnc.com/.../business-checking-offer](https://www.pnc.com/en/small-business/banking/business-checking-overview/business-checking-offer.html)
- Huntington business checking promotions:
  [huntington.com/business-banking-promotions-offers](https://www.huntington.com/business-banking-promotions-offers)
- Truist small-business offer flow:
  [truist.com/open-account/small-business](https://www.truist.com/open-account/small-business)
- Truist Dynamic Business Checking fees:
  [truist.com/.../dynamic-business-checking/disclosures-and-fees](https://www.truist.com/small-business/banking/checking/dynamic-business-checking/disclosures-and-fees)
- Axos Basic Business Checking:
  [axosbank.com/business/business-checking-accounts/basic-business-checking](https://www.axosbank.com/business/business-checking-accounts/basic-business-checking)
- Axos Business Bundle:
  [axosbank.com/business/axos-business-bundle](https://www.axosbank.com/business/axos-business-bundle)
- BMO business checking bonus page:
  [bmo.com/.../bb-checking-offer](https://www.bmo.com/en-us/main/business-banking/bank-accounts/bb-checking-offer/)
- BMO Simple Business Checking:
  [bmo.com/.../simple-business-checking](https://www.bmo.com/en-us/main/business-banking/checking-accounts/simple-business-checking/)
- BMO Digital Business Checking fee schedule PDF:
  [digital-business-checking.pdf](https://www.bmo.com/en-us/pdf/sb/digital-business-checking.pdf)

## Added in this pass

`content/banking-bonuses-business-expansion.json` adds current public business coverage across:

- Chase business checking.
- U.S. Bank Business Essentials and Platinum Business.
- Wells Fargo Initiate, Navigate, and Optimize business checking.
- PNC Business Checking, Business Checking Plus, Treasury Enterprise Plan, and Analysis Business Checking.
- Huntington Unlimited Business Checking and Unlimited Plus Business Checking.
- Axos Basic Business Checking and the Axos Business Bundle.
- Truist Simple and Dynamic Business Checking.
- BMO Digital, Simple, Premium, and Elite Business Checking.

## Not added yet

These are the main remaining gaps after this pass:

- Capital One business checking bonuses appear to be targeted and are not exposed cleanly on an official public bonus page.
- Bluevine's current bonus visibility is partner/referral-driven rather than clearly disclosed on an official public application flow.
- American Express Business Checking has had targeted or time-limited welcome offers, but no clear public bonus terms surfaced in this pass.
- KeyBank surfaced stale business bonus terms ending January 16, 2026, so it was intentionally excluded.

## Data quality note

This pass prioritizes catalog coverage and business segmentation.

- Some business offers use public promo pages plus product-fee pages to model estimated fees.
- A few banks expose one promotion across several eligible accounts; those are represented as separate directory offers but the planner now dedupes by bank to avoid impossible same-bank stacking.
- The banking pipeline is still a curated snapshot, not a live official-bank feed.
