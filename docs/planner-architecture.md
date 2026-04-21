# Planner Architecture

This document defines the active planner contract and execution flow.

## Boundary

- The public planner API is `POST /api/plan`.
- Request validation lives in `src/lib/plan-contract.ts`.
- Planner schemas, shared planner types, normalization, and ranking live under `src/lib/planner/*`.
- The engine accepts only the current mode-based planner request shapes.

## Planner modes

### `full`

- Lanes: `cards`, `banking`
- Intake fields:
  - `audience`
  - `monthlySpend`
  - `directDeposit`
  - `state`
  - `ownedCardSlugs`
  - `availableCash`
  - `ownedBankNames`
- Override-only fields:
  - `amexLifetimeBlockedSlugs`
  - `chase524Status`
- Card ranking behavior:
  - no spend-category fit
  - no credit-profile filtering

### `cards_only`

- Lanes: `cards`
- Intake fields:
  - `audience`
  - `monthlySpend`
  - `spend`
  - `credit`
  - `recentCardOpenings24Months`
  - `ownedCardSlugs`
- Derived fields:
  - `chase524Status`
- Override-only fields:
  - `amexLifetimeBlockedSlugs`
  - `chase524Status`
- Card ranking behavior:
  - spend-category fit enabled
  - credit-profile filtering enabled

## Normalization rules

- Unknown eligibility stays unknown.
- Full planner inputs do not fabricate issuer-specific eligibility.
- Cards-only inputs derive `chase524Status` from `recentCardOpenings24Months`.
- Overrides win over derived values.
- Unsupported answer shapes are rejected at schema boundaries.

## Execution flow

1. `planRequestSchema` validates the incoming request.
2. `normalizePlannerContext(...)` converts mode-specific answers into a `PlannerContext`.
3. `rankPlannerResults(...)` scores and filters eligible card candidates.
4. `buildPlanRecommendations(...)` combines ranked cards and banking bonuses into planner recommendations, exclusions, and scheduler inputs.
5. `buildPlanSchedule(...)` selects the final timeline and diagnostics bundle.
6. `planResponseSchema` validates the API response payload.

## Core modules

- `src/lib/planner/types.ts`: shared planner enums and type unions.
- `src/lib/planner/schemas.ts`: Zod request/context schemas.
- `src/lib/planner/normalize-context.ts`: answer-shape normalization into `PlannerContext`.
- `src/lib/planner/ranking-engine.ts`: card ranking and Chase 5/24 derivation.
- `src/lib/planner-recommendations.ts`: recommendation assembly and exclusion logic.
- `src/lib/plan-engine.ts`: scheduling.

## Stored results

- Browser storage persists only the current planner payload shape.
- Stored payloads contain `plannerContext`, recommendations, exclusions, schedule, and schedule issues.
- Storage keys use the current `v2` namespace.

## Removed fields

These fields are not part of the active planner contract and should not be reintroduced unless engine behavior requires them:

- `pace`
- `goal`
- `fee`
- `bankAccountPreference`
