# Catalog Audit Snapshot

Date: March 29, 2026

## Summary

- Banking source data was patched to replace third-party offer URLs with official bank pages where they were confirmed on March 29, 2026.
- Expired or unconfirmed personal banking offers were deactivated rather than left live.
- The card catalog is no longer split between checked-in files and the older entity-asset-only database path. The former DB-only foundation cards now live in `content/cards-foundation.json`, and the database can be synced from all checked-in card files with `npm run cards:import-all`.
- The remaining card backlog is now concentrated in incomplete explicit card-art coverage and cards whose current welcome offers still are not verified from official issuer sources.
- Weak fallback imagery is no longer an active issue: issuer favicon-style fallbacks were replaced with curated local brand assets for cards, and U.S. Bank banking logos now resolve to a local fallback asset instead of `logo-personal.svg`.

## Banking Fixes Applied

- `wells-fargo-everyday-checking-325`
  - Switched `offerUrl` to the official Wells Fargo bonus page: [accountoffers.wellsfargo.com/checkingoffer](https://accountoffers.wellsfargo.com/checkingoffer/)
  - Re-verified offer end date as April 14, 2026.
- `bmo-smart-advantage-checking-400`
  - Switched `offerUrl` to the official BMO promo page: [bmo.com/.../digital-offer](https://www.bmo.com/en-us/main/personal/checking-accounts/digital-offer/)
  - Re-verified offer end date as May 4, 2026.
- `etrade-max-rate-checking-300`
  - Switched `offerUrl` to E*TRADE's official account offers page: [us.etrade.com/what-we-offer/our-accounts](https://us.etrade.com/what-we-offer/our-accounts)
  - Re-verified that the checking bonus was still listed through March 31, 2026.
- `bank-of-america-advantage-checking-500`
  - Replaced the third-party source URL with Bank of America's official Advantage Banking page: [bankofamerica.com/.../advantage-banking](https://www.bankofamerica.com/deposits/checking/advantage-banking/?view_page=compare)
  - Remaining caveat: the bonus details are partially gated behind ZIP or application state and still need manual in-browser reconfirmation.

## Banking Records Deactivated

The following offers were left in the file for historical context but marked inactive because the official source no longer supported them, or no public official bonus page could be confirmed:

- `chime-checking-350`
- `etrade-premium-savings-2000`
- `truist-one-checking-400`
- `marcus-online-savings-1500`
- `huntington-perks-checking-400`
- `huntington-platinum-perks-checking-600`

Official evidence used in this pass:

- Wells Fargo Everyday Checking bonus: [accountoffers.wellsfargo.com/checkingoffer](https://accountoffers.wellsfargo.com/checkingoffer/)
- BMO $400 personal checking bonus: [bmo.com/.../digital-offer](https://www.bmo.com/en-us/main/personal/checking-accounts/digital-offer/)
- E*TRADE account offers hub: [us.etrade.com/what-we-offer/our-accounts](https://us.etrade.com/what-we-offer/our-accounts)
- Marcus bonus status page: [marcus.com/us/en/savings/osa-savingsbonus](https://www.marcus.com/us/en/savings/osa-savingsbonus)
- Truist One Checking offer terms: [truist.com/open-account/banking-accounts](https://www.truist.com/open-account/banking-accounts)
- Huntington personal checking promotions page: [huntington.com/checking-account-promotions-bonuses-offers](https://www.huntington.com/checking-account-promotions-bonuses-offers)

## Live Catalog Findings

Read-only database queries plus the post-audit import on March 29, 2026 showed:

- 37 active banking offers in the live database after import.
- 0 active banking offers tied to third-party source URLs after import.
- 0 active banking offers already past their expiration date after import.
- 87 active cards in the live database.

## Card Catalog Findings

- 87 active card records are now represented in checked-in `content/cards*.json` files.
- 23 former entity-asset-only slugs were normalized into `content/cards-foundation.json`.
- 0 entity-asset-backed live cards remain outside the checked-in card seed files.
- 31 active content-card records are missing an explicit `imageUrl`.
- 32 active cards in the checked-in catalog currently have no `isCurrentOffer` sign-up bonus record.
- 0 active cards currently degrade to low-value fallback artwork.
- The remaining imagery gap is now quality, not breakage: many cards still rely on curated issuer fallback assets instead of explicit card-product art.

### Card Fixes Applied

- Added `content/cards-foundation.json` to represent the 23 formerly DB-only core issuer cards.
- Updated the audit script so it reads all checked-in `content/cards*.json` files instead of hard-coding two expansion batches.
- Updated the card import path to support `--all`, and imported all three checked-in card files into the database on March 29, 2026.
- Added local fallback logo assets for weak card issuers in `public/card-logos/` and a local U.S. Bank asset in `public/bank-logos/us-bank.svg`.
- Updated resolver mappings so banking and card surfaces no longer fall back to favicon-style or `logo-personal.svg` assets.
- Added 33 explicit issuer-hosted card-art URLs across Chase, U.S. Bank, Bank of America, American Express, and Capital One records in the expansion seed files.
- Backfilled official reward structures for:
  - `amex-gold-card`
  - `amex-platinum-card`
  - `chase-sapphire-preferred`
  - `chase-sapphire-reserve`
  - `citi-strata-premier-card`
- Re-verified and corrected current Blue Cash welcome offers from official American Express sources:
  - `amex-blue-cash-everyday`: `$200` after `$2,000` in purchases in the first 6 months
  - `amex-blue-cash-preferred`: `$250` after `$3,000` in purchases in the first 6 months
- Removed stale or unverifiable current-offer placeholders from:
  - `amex-gold-card`
  - `amex-platinum-card`
  - `bilt-mastercard`

## Logo Findings

- Banking logos are generally in better shape than card imagery because `src/lib/banking-brand-assets.ts` has curated fallbacks.
- There are no remaining low-fidelity banking-logo fallbacks in the active catalog after the U.S. Bank local asset update.
- There are no remaining low-value fallback-art cases in the active card catalog after the curated issuer fallback pass.
- Card imagery remains incomplete for part of the active catalog, especially the issuer pages where product-art extraction stayed ambiguous, because 31 cards still rely on issuer fallback assets rather than explicit per-product art.

## Repeatable Audit

Run the local audit snapshot with:

```bash
npm run catalog:audit
```

Sync all checked-in card batches into the database with:

```bash
npm run cards:import-all
```

This script reports:

- active banking records with non-official source URLs
- active banking records that are already expired
- active banking records with weak or missing effective logos
- content card coverage gaps, missing image URLs, and missing current bonus records
