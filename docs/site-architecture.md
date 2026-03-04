# Site Architecture (v1)

Last updated: March 4, 2026
Status: Draft for implementation

## 1) Product Promise

The Stack helps users make more money from bank and credit sign-up bonuses with a clear 12-month action plan.

North-star equation:

`12-Month Bonus Value = Credit Card Bonuses + Banking Bonuses`

This equation should appear across homepage messaging, planner framing, and plan results.

## 2) Core UX Decision

Use a guided multi-page flow, not one long page and not two disconnected products.

- Homepage handles both jobs: value proposition and process orientation.
- Do not build `/start` in v1.
- One primary journey: `Homepage -> Planner -> Results -> Offer Detail`.
- Results show two recommendation lanes in one view:
  - Credit card bonuses
  - Banking bonuses

## 3) Primary Navigation

1. Start Here (`/tools/card-finder` in v1; can be renamed later)
2. Card Bonuses (`/cards`)
3. Banking Bonuses (`/banking`)
4. Tools
5. Learn (`/blog` in v1)
6. About

## 4) Canonical Route Map (v1)

| Route | Purpose | Primary CTA |
|---|---|---|
| `/` | Value proposition and entry to planner | Build My Bonus Plan |
| `/tools/card-finder` | Guided intake for 12-month planning | See My Plan |
| `/plan/results` | Unified output with card + banking lanes | Start Do-Now Step |
| `/cards` | Discover and filter card bonus opportunities | Compare Card Offers |
| `/banking` | Discover and filter banking bonus opportunities | Compare Bank Offers |
| `/cards/[slug]` | Card-offer execution details | Apply / Save to Plan |
| `/banking/[slug]` | Banking-offer execution details | Open Account / Save to Plan |
| `/blog` | Educational strategy content | Read Playbook |
| `/about` | Trust and brand explanation | Start Planner |
| `/contact` | Support and feedback | Email Team |

## 5) Route Migration Notes

| Candidate route | Decision | Notes |
|---|---|---|
| `/start` | Remove | Homepage already covers orientation and entry. |
| `/credit-card-bonuses` | Do not launch in v1 | Keep `/cards` as canonical. |
| `/banking-bonuses` | Do not launch in v1 | Keep `/banking` as canonical. |
| `/offers/[slug]` | Replace with typed routes | Use `/cards/[slug]` and `/banking/[slug]`. |
| `/tools/bonus-planner` | Future alias | If introduced, 301 redirect from old to new or vice versa. |

## 6) Primary User Flows

### A) Guided flow (new user)

1. User lands on homepage.
2. User clicks `Build My Bonus Plan`.
3. User completes planner intake (3-5 short steps).
4. User sees one combined projected value and two lanes (cards and banking).
5. User executes `Do Now` steps first, then `Do Next`.
6. User joins newsletter and optionally signals consultation interest.

### B) Discovery flow (SEO/intent user)

1. User lands on `/cards` or `/banking`.
2. User explores opportunities and reads one offer detail.
3. User is prompted to build a full 12-month plan.
4. User enters guided flow.

### C) Return flow (existing user)

1. User returns from newsletter.
2. User reviews updated opportunities and deadlines.
3. User adjusts next steps in plan.

## 7) Planner Intake Structure (v1)

Target completion time: under 3 minutes.

1. Profile basics (credit range, goals)
2. Cash-flow constraints (ability to float required spend/deposits)
3. Banking constraints (direct deposit ability, state availability)
4. Timeline and effort tolerance
5. Output confirmation

State-availability decision in v1:

- Collect user state in intake.
- Filter out clearly ineligible banking offers when restriction data is known.
- If restriction data is partial, show offer with a clear "check state eligibility" warning.

## 8) Plan Results Structure (Most Important Page)

Top-level:

1. Combined projected 12-month value
2. Split value by lane (cards vs banking)

Execution layer:

1. `Do Now` actions (highest ROI / best fit)
2. `Do Next` actions (timing-dependent follow-ups)

Each recommendation card should show:

- Estimated net value
- Time and effort level
- Key requirements
- Timeline and deadline
- CTA to execution detail

Bottom section:

- Newsletter signup
- Optional consultation-interest toggle

Results state strategy (v1):

- Persist intake + generated results in `sessionStorage`.
- Mirror to `localStorage` with timestamp for refresh recovery.
- If results are missing or stale, send user back to planner with a resume prompt.
- Phase 2: move to server-saved plans (DB) for durable retrieval and sharing.

Graceful degradation:

- If user qualifies for only one lane, show that lane full-width.
- Show the unavailable lane as `Not a fit right now` with concrete unlock steps.
- Combined value should equal available-lane value (no inflated placeholders).

## 9) Data Model and Sources

Card bonuses (v1):

- Source: existing Prisma-backed card data.
- Routes: `/cards`, `/cards/[slug]`.

Banking bonuses (v1):

- Source: Prisma-backed `BankingBonus` table with seed fallback when DB data is unavailable.
- Routes: `/banking`, `/banking/[slug]`.

Shared planner output model (v1):

- Normalize cards and banking offers to a shared recommendation shape for ranking/output.
- Keep offer-type-specific fields in detail pages, not in one generic detail template.

Phase 2 data plan:

- Add/maintain ingestion path for banking offers (manual JSON import now, partner feeds later).
- Keep shared ranking/view models at the service layer.

## 10) Content and Messaging Guardrails

- Lead with expected user outcome, not feature labels.
- Explain tradeoffs and requirements in plain language.
- Avoid individualized-advice claims in marketing copy.
- Keep legal alignment with Terms language (educational content).
- Keep one dominant CTA per major page.

## 11) Analytics and Funnel Events (v1)

Track at minimum:

1. Landing view
2. Planner start
3. Planner completion
4. Plan result view
5. Recommendation click
6. Newsletter subscribe
7. Consultation-interest opt-in
8. Plan resume / restart (results recovery)

## 12) Build Phases

### Phase 1: Architecture lock

1. Finalize this route map and migration decisions.
2. Confirm canonical paths in nav and internal links.

### Phase 2: Data foundation

1. Maintain banking offers in DB via import workflow and verification cadence.
2. Define shared planner recommendation shape.

### Phase 3: Homepage alignment

1. Update homepage around two-lane bonus model.
2. Keep one primary CTA into planner.

### Phase 4: Planner and results shell

1. Build intake steps with stable schema.
2. Build unified results layout with persistence and one-lane fallback behavior.

### Phase 5: Hubs and offer detail expansion

1. Expand `/banking` and add `/banking/[slug]`.
2. Standardize detail-page layout across cards and banking without forcing one slug route.

### Phase 6: Optimization

1. Improve conversion copy and visual hierarchy.
2. Add deeper personalization and segmentation.

## 13) Definition of Done for Architecture

- Navigation reflects canonical v1 routes.
- Homepage covers both value proposition and orientation.
- Planner output combines both bonus lanes in one view.
- Results persistence handles refresh and recovery gracefully.
- One-lane qualification states are explicit and actionable.
- Newsletter and consultation-interest flow are integrated without visual clutter.
