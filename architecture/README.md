# Product Architecture - Index

This folder is the source of truth for the shipped and planned architecture of reachfyp.com.

Every meaningful product, schema, auth, onboarding, routing, or module change should update this folder in the same change set.

## Product Direction

- One product only: reachfyp.com
- No worker role
- No task system
- Product category: creator marketplace
- Core differentiation: authenticity scoring, performance tracking, smart ranking, instant hire, and lower-friction onboarding for brands and creators

## Current Active Stack

- Monorepo: pnpm + Turborepo
- Web: Next.js 15 App Router + React 19 + TypeScript
- Server layer: Next.js route handlers and server-rendered routes under `apps/web`
- Shared backend package: `packages/api`
- Persistence: local SQLite through `node:sqlite`, wrapped by the API package
- Auth: app-owned email/password auth plus Apple and Google OAuth callbacks
- Session model: cookie-backed sessions via `reachfyp_session`
- Token verification / OAuth signing helpers: `jose`
- Styling: app-level CSS variables plus shared React primitives
- Mobile: deferred; no active mobile runtime in this workspace yet

Implementation rules:
- Share business logic through packages, not by duplicating route-specific behavior.
- Document the system that actually exists in the repo, not an older target-state platform plan.

## Current Backend Platform

- Core backend today: app-owned Next.js server + local SQLite persistence
- Data access layer: `packages/api`
- Auth storage: `auth_users`, `auth_sessions`, `auth_password_reset_tokens`, and `auth_email_verification_tokens` in the shared SQLite database
- Marketplace storage: creator, hire, message, payout, notification, and related marketplace records in the same SQLite foundation
- OAuth providers currently wired: Apple and Google
- Payments, hosted auth, hosted database, and background job infrastructure remain future integrations, not active platform dependencies in this repo today

## Approved Milestone 5 Production Decisions

- Transactional auth email for password reset and verification will use Postmark in staging and production.
- Production persistence will move from local SQLite to managed Postgres while keeping the same app-owned tables and the `packages/api` boundary.
- Session auth will stay database-backed with hashed session tokens; Phase 1 will not migrate to JWTs.
- Production cookies will harden to a host-only secure session cookie with `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`.
- Session rotation remains server-owned and should occur on sign-in, provider callback sign-in, and password reset completion.
- Background job infrastructure is still deferred; Phase 1 production can send transactional auth email directly from the server layer through a mailer adapter.

Enterprise rule:
- Critical business actions are server-owned.
- Browsers must never write trust-critical or financial state directly.
- If the system later migrates to hosted infra, the docs must describe both the migration decision and the new ownership boundary in the same PR.

## Backend Ownership Model

Client apps may read marketplace and account surfaces through approved routes, but core writes remain server-owned.

Server-owned business actions:
- auth registration and sign-in
- session creation and invalidation
- creator username reservation and claim validation
- Apple and Google OAuth callback handling
- creator profile publication and claimed-username rebinding
- instant hire creation
- wallet ledger writes
- escrow hold and release
- payout requests and admin review flows
- deliverable approval state transitions
- admin moderation actions
- notification generation

## Files

| File | Contents |
|---|---|
| 01_shared_data_model.md | Current persistence model, including auth/session tables and marketplace entities |
| 02_roles_permissions.md | Current role model, permission matrix, and auth/session strategy |
| 03_user_flows.md | Current onboarding, signup, hiring, payout, and admin flows |
| 04_page_maps.md | Current implemented web routes, onboarding entry points, and protected surfaces |
| 05_module_architecture.md | Current runtime architecture, module boundaries, and ownership rules |
| 06_live_delivery_tracker.md | Live tracker for completed work, remaining work, validation, and risks |

## Canonical Product Rules

These rules are non-negotiable unless architecture is explicitly revised first.

- Do not reintroduce any task or worker concepts.
- Do not build follower-count-first ranking.
- Do not ship marketplace UI that hides authenticity or performance signals.
- Do not document infrastructure that is not actually active unless it is clearly labeled as future-state.
- Do not add major new product areas outside the current phase without updating architecture first.
- Do not implement financial or trust-critical workflows as direct client-to-database writes.
- Do not change onboarding or auth routing without updating user flows and page maps in the same change.

## Delivery Phases

### Phase 1 - Core Launch

Build:
- role-aware auth and session handling
- password reset and email verification recovery flows
- creator and brand onboarding
- creator username reservation and claim flow
- creator profiles
- social connect
- packages
- instant hire
- hires
- deliverables
- messaging and notifications
- payout requests and admin review
- core web marketplace and dashboard experience

Phase 1 backend stack:
- Next.js web app with route handlers as the application server layer
- shared SQLite persistence via `packages/api`
- cookie-backed sessions
- Apple and Google OAuth route handlers where configured

Do not build in Phase 1:
- speculative mobile breadth
- complex dispute automation
- hosted infrastructure migrations that are not required to validate the product loop

Phase 1 goal:
- prove that creators can onboard cleanly, brands can discover creators, and both sides can complete live hire flows end to end

Phase 1 exit criteria:
- creator can reserve a username, sign up, and complete profile setup
- brand can sign up and move straight into discovery
- brand can instantly hire and fund escrow placeholder state
- creator can submit deliverables
- brand can approve or refund through the current workflow
- both sides can message each other

### Phase 2 - Market Advantage

Build:
- deeper tracking links
- conversion events
- creator metrics engine hardening
- authenticity badges
- smart ranking depth
- analytics surfaces that support creator selection

Phase 2 goal:
- make reachfyp visibly better than profile-only creator marketplaces

### Phase 3 - Operational Scale

Build:
- verification hardening
- disputes tooling
- payout operations improvements
- admin automation
- production-grade persistence and infrastructure evolution where justified

Phase 3 goal:
- make the platform safer, easier to run, and scalable for higher transaction volume

## How We Keep Every Developer Aligned

### 1. This folder is required reading

Before building any feature, check:
- data model
- relevant user flow
- page map
- module architecture
- live delivery tracker
- current phase in this README

### 2. Every feature must declare its phase

Every task, ticket, PR, or implementation note should state:
- current phase
- module affected
- whether it changes product contract, auth behavior, or routing

### 3. Architecture changes must be documented in the same PR

If a developer changes:
- schema shape
- auth/session behavior
- user flow
- routing structure
- module boundaries
- product scope

They must update the relevant file in this folder in the same change set.

### 4. One source of truth, not side documents

Avoid unofficial planning notes that drift from architecture. If a decision matters, it belongs in this folder.
