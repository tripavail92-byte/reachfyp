# Module Architecture

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               WEB CLIENT                                   │
│                                                                             │
│  Next.js App Router pages                                                   │
│  - homepage                                                                 │
│  - /creator and /brand onboarding                                           │
│  - public marketplace and creator profiles                                  │
│  - creator workspace                                                        │
│  - brand hire operations                                                    │
│  - admin moderation and payout review                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APP SERVER / ROUTE LAYER                            │
│                                                                             │
│  apps/web                                                                   │
│  - server components decide route state                                     │
│  - route handlers own writes and auth transitions                           │
│  - OAuth start/callback handlers                                            │
│  - session cookie attach/invalidate                                         │
│  - hire, deliverable, payout, and admin mutation endpoints                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHARED DOMAIN / DATA LAYER                          │
│                                                                             │
│  packages/api                                                               │
│  - SQLite-backed repositories and business rules                            │
│  - auth user/session storage                                                │
│  - creator records and username availability                                │
│  - hire lifecycle, notifications, payouts, moderation                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     ▼                                 ▼
          Apple / Google OAuth                  Future infra candidates
          identity providers                    hosted DB, jobs, payments
```

---

## Current System Rules

- The current repo is app-owned end to end. There is no active Supabase/Auth/JWT runtime in this workspace.
- Persistent state flows through `packages/api` and the shared SQLite database.
- Browsers never write auth, hire, payout, moderation, or reserved-username state directly.
- Route handlers and server-rendered entry pages decide onboarding recovery paths.
- Legacy detached signup routes are compatibility bridges only; primary onboarding now lives on `/creator` and `/brand`.

## Data Access Boundary

### Browser-readable surfaces

Allowed through pages and approved handlers:
- public creator marketplace and creator profile reads
- creator-owned workspace reads and form posts
- brand-owned hire queue, notifications, and conversation reads
- admin moderation and payout review reads

### Server-owned mutation surfaces

Must be written by route handlers or server-owned package functions:
- `auth_users`
- `auth_sessions`
- reserved creator username assignment and release
- Apple/Google auth linkage
- creator profile claim rebinding
- hire creation and lifecycle transitions
- wallet placeholder ledger writes
- payout requests and admin payout decisions
- moderation actions
- notification generation

---

## Backend Modules

### 1. auth_and_onboarding
Responsibilities:
- email/password registration and sign-in
- session creation and sign-out
- Apple and Google OAuth start/callback flows
- creator username reservation before profile completion
- role-aware redirect recovery back to creator or brand onboarding surfaces
- device-aware provider presentation support

Active routes:
- POST /auth/register
- POST /auth/sign-in
- POST /auth/sign-out
- GET /auth/apple/start
- GET or POST /auth/apple/callback
- GET /auth/google/start
- GET /auth/google/callback

Key rules:
- creator signup begins after username selection, not before it
- creator failures route back to `/creator?...&signup=1`
- brand failures route back to `/brand?signup=1`
- `/creator-signup` and `/brand-signup` remain compatibility redirects only

---

### 2. creator_discovery
Responsibilities:
- creator listing and filtering
- creator detail rendering
- username availability checks for onboarding
- seeded creator claim support and profile route resolution

Active surfaces:
- GET /creators
- GET /creators/[username]
- `/creator` onboarding username flow

---

### 3. creator_workspace
Responsibilities:
- creator profile CRUD
- package CRUD
- social connect, sync, and delete operations
- creator-side hire queue and deliverable submission
- payout request submission and payout history

Active routes:
- /creator/profile
- POST /creator/profile/save
- POST /creator/profile/delete
- POST /creator/packages/save
- POST /creator/packages/delete
- POST /creator/socials/connect
- POST /creator/socials/sync
- POST /creator/socials/delete
- /creator/hires
- /creator/hires/[hireId]
- POST /creator/hires/[hireId]/deliverables
- /creator/payouts
- POST /creator/payouts/request

---

### 4. brand_operations
Responsibilities:
- brand onboarding and signup modal state
- instant hire checkout entry
- brand hire queue
- hire review actions
- notifications and threaded messaging

Active routes:
- /brand
- /dashboard/instant-hire/[packageId]
- POST /dashboard/instant-hire/[packageId]/confirm
- /dashboard/hires
- /dashboard/hires/[hireId]
- POST /dashboard/hires/[hireId]/lifecycle
- /dashboard/messages/[conversationId]
- POST /dashboard/messages/[conversationId]/reply
- /dashboard/notifications
- POST /dashboard/notifications/read

---

### 5. admin_operations
Responsibilities:
- hire moderation
- payout review
- platform-side intervention on financial and delivery state

Active routes:
- /admin/hires
- POST /admin/hires/[hireId]/moderate
- /admin/payouts
- POST /admin/payouts/[payoutRequestId]/review

---

### 6. shared_persistence
Responsibilities:
- own SQLite connection lifecycle
- expose auth, creator, hire, messaging, notification, and payout records through typed helpers
- run low-friction schema evolution on startup for newly added columns and indexes

Current shipped auth storage details:
- `auth_users` stores `company_name`, `reserved_creator_username`, `apple_subject`, `google_subject`, and `email_verified_at`
- `auth_sessions` stores hashed session tokens and expiry
- `auth_password_reset_tokens` stores hashed single-use reset tokens with expiry and used state
- `auth_email_verification_tokens` stores hashed single-use verification tokens with expiry and used state

---

## Current Auth and Username Claim Sequence

### Creator
1. User enters a candidate handle on `/creator`
2. Server checks availability against existing public creator usernames and reserved usernames
3. If valid, modal opens on `/creator?username=...&signup=1`
4. User signs up with Google, Apple, or email
5. Auth layer stores the reserved username on the account record and issues verification state according to signup path
6. User is redirected into creator profile completion
7. Creator profile publication consumes the reserved username into the public creator identity

### Brand
1. User opens signup on `/brand?signup=1`
2. User signs up with Google, Apple, or email
3. Account is created with role `brand` and verification state according to signup path
4. User is redirected into marketplace discovery or hire continuation

---

## Planned Evolution

These are valid future directions, but they are not active system dependencies today:
- hosted Postgres or Supabase migration
- production-grade payment processor integration
- background job framework for scheduled recalculation and email delivery
- expanded social OAuth beyond the current local creator social connection scaffolding
