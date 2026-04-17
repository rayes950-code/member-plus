<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Rationale: Initial ratification from Member Plus PRD V3.0 — first concrete constitution.

Principles defined (7):
  I.   Salla-First Payment Integrity (NON-NEGOTIABLE)
  II.  Bilingual by Default (AR/EN, RTL-Primary)
  III. Zero Manual Operations After Setup
  IV.  Smart Defaults, Guided Flow
  V.   Salla Platform Contract Compliance
  VI.  Event-Driven State Integrity
  VII. Merchant Data Ownership

Added sections:
  - Technical Architecture Constraints
  - Development Workflow & Quality Gates
  - Governance

Templates requiring review (⚠ pending sync):
  ⚠ .specify/templates/plan-template.md         — add Constitution Check items for principles I, II, V, VI
  ⚠ .specify/templates/spec-template.md         — enforce AR+EN acceptance criteria in all user-facing FRs
  ⚠ .specify/templates/tasks-template.md        — add task categories: webhook handler, scheduler job, bilingual strings, Salla API contract
  ⚠ .specify/templates/checklist-template.md    — include payment-flow + bilingual + idempotency checks

Deferred items: none.
-->

# Member Plus Constitution

## Core Principles

### I. Salla-First Payment Integrity (NON-NEGOTIABLE)

All monetary flows MUST pass through Salla's payment infrastructure. The application MUST NOT hold, collect, transfer, or store payment credentials or card data under any circumstance.

- SaaS fees (merchant → us) flow exclusively through Salla App Store billing.
- Membership fees (end customer → merchant) flow exclusively through Salla Recurring Payments.
- Our systems react to Salla webhooks; they never initiate charges or refunds directly.

Rationale: This is both a platform requirement and a trust boundary. A single violation exposes the merchant, the customer, and the platform relationship.

### II. Bilingual by Default (AR/EN, RTL-Primary)

Every user-facing surface MUST render correctly in Arabic and English. Arabic is the primary language with RTL layout; English is a required parallel, not an optional add-on.

- Applies to: merchant dashboard, member widgets, badges, emails, SMS, push notifications, error states, empty states, admin panels.
- Every user-visible string ships as an AR/EN pair; no feature may merge with only one language populated.
- Layout, iconography, and spacing MUST validate in RTL before release.

Rationale: Primary audience is Saudi merchants and their customers. Monolingual screens break trust and violate the stated bilingual standard of the PRD.

### III. Zero Manual Operations After Setup

Between the 1st and 28th of any calendar month, the merchant MUST be able to do nothing and have the membership program continue to run correctly.

- Coupon generation, renewals, grace periods, quota resets, notifications, and monthly reports MUST be driven by scheduler jobs and webhook handlers.
- Features that require recurring merchant intervention are out of scope.
- The only merchant-initiated monthly action permitted is configuring the *next* month's gift — and it has a smart default that satisfies the automation on its own.

Rationale: "Zero manual effort" is a primary success metric. Manual steps destroy the product's core promise and inflate churn.

### IV. Smart Defaults, Guided Flow

Every configuration screen MUST present pre-filled, contextually reasonable defaults. The merchant confirms or adjusts; they never face a blank form.

- Full first-time setup MUST complete in ≤15 minutes (target: ~8 minutes).
- Each step surfaces a single primary CTA and a single contextual "why this matters" explanation.
- Defaults reflect the recommended plan shape (Silver 49 SAR / Gold 99 SAR, discount tiers, etc.) as documented in the PRD.

Rationale: Our primary users are non-technical merchants. Blank forms are the single largest abandonment driver during onboarding.

### V. Salla Platform Contract Compliance

The app operates exclusively within Salla's documented surfaces. Features requiring undocumented or unsupported Salla capabilities are out of scope until Salla supports them.

- Supported surfaces: App Store billing, Recurring Payments API, Special Offers, Coupons, Products, Orders, Webhooks, App Snippet injection points.
- All integrations MUST handle Salla's declared rate limits, auth lifecycle, and error shapes.
- Any workaround that depends on scraping, private endpoints, or undocumented behavior is prohibited.

Rationale: Platform risk is existential. A single policy violation can remove the app from the store.

### VI. Event-Driven State Integrity

All member and merchant state transitions MUST be driven by Salla webhooks or scheduler jobs. Polling, user-triggered recomputation, or implicit state derivation is prohibited for authoritative state.

- Every webhook handler MUST verify Salla's signature, be idempotent, and be race-safe against concurrent deliveries.
- Every scheduler job MUST be idempotent across reruns and resumable after partial failure.
- Every state machine (subscription, payment, gift coupon, benefit quota, trial) MUST be documented and reflected in code.

Rationale: Money-adjacent flows and recurring-billing flows fail silently and unforgivably when state is derived inconsistently.

### VII. Merchant Data Ownership

Merchant and member data belongs to the merchant. A complete, standard-format export MUST be available at any time from the dashboard.

- Exports cover: plans, members, subscription history, benefit usage, savings totals, activity log.
- Exports ship in CSV and/or JSON (no proprietary formats).
- Deactivating or offboarding a merchant MUST NOT block export access during the retention window.

Rationale: Data portability earns trust and reduces perceived lock-in, which in turn lowers merchant acquisition friction.

## Technical Architecture Constraints

- **Platform**: Salla Partner App, distributed via Salla App Store.
- **Primary device**: Desktop browser (merchant dashboard); mobile web (member-facing widgets must be responsive).
- **Primary locale**: Arabic (ar-SA), timezone Asia/Riyadh. All dates stored as ISO-8601 UTC and displayed in Riyadh time.
- **Mandatory Salla integrations**: App Store billing, Recurring Payments, Special Offers, Coupons, Products, Orders, Webhooks, App Snippet injection.
- **Bilingual storage**: Every user-visible string is stored as `{ ar: string, en: string }` — never a single-locale field.
- **Scheduler**: A durable, idempotent scheduler MUST run the 28th-of-month, 1st-of-month, and 3-days-before-month-end jobs, plus grace-period sweeps.
- **Observability**: Every webhook, scheduler job, and Salla API call emits a structured log line with correlation ID, merchant ID, and event type. The activity log is the merchant-visible surface; structured logs are the operator-visible surface.

## Development Workflow & Quality Gates

- **Spec-first**: No feature begins implementation without passing through `/speckit-specify` and, when ambiguity exists, `/speckit-clarify`.
- **Plan gate**: `/speckit-plan` MUST verify every principle above. The Constitution Check section of the plan template enumerates each principle as a pass/fail item.
- **Analysis gate**: `/speckit-analyze` MUST run before `/speckit-implement` on any feature touching payments, webhooks, or bilingual surfaces.
- **Webhook tests**: Every webhook handler ships with integration tests exercising idempotency, signature verification, and out-of-order delivery.
- **Bilingual gate**: No UI merge is accepted with missing AR or EN strings. Linting enforces this at CI.
- **Race-condition review**: Scheduler jobs and webhook handlers that touch the same aggregate (subscription, gift, coupon) require an explicit race-condition note in their PR description.

## Governance

This constitution supersedes all other development practices for the Member Plus project. When any document, template, or convention conflicts with this constitution, this constitution wins until it is formally amended.

- **Amendment procedure**: Amendments are proposed as a change to `.specify/memory/constitution.md` with a Sync Impact Report prepended. Dependent templates MUST be updated in the same change.
- **Versioning policy**: Semantic versioning applies.
  - **MAJOR**: a principle is removed or redefined in a backward-incompatible way.
  - **MINOR**: a new principle or section is added, or guidance is materially expanded.
  - **PATCH**: clarifications, wording, or typo fixes that do not change meaning.
- **Compliance review**: `/speckit-analyze` runs the constitution check on every feature. Any deviation MUST be either fixed or justified in writing in the feature's plan under a "Complexity Deviations" heading.
- **Runtime guidance**: Day-to-day implementation guidance lives in `.specify/templates/` and feature plans. This constitution stays at the level of invariants.

**Version**: 1.0.0 | **Ratified**: 2026-04-16 | **Last Amended**: 2026-04-16
