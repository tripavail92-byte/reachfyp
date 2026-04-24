# Live Delivery Tracker

This file is the live execution tracker for reachfyp.com.

Use it to record:
- what is done
- what is in progress
- what is blocked
- what remains
- which validations passed
- which tests still need to run

Update rule:
- every meaningful implementation change should update this file in the same pass when status changes
- checkboxes should reflect the real repo state only
- validation entries should only be marked complete after the command or manual check actually passed

## Maintenance Workflow

For every feature change, update this file before closing the work:
- move completed items to the correct checklist or completed section
- add any newly discovered remaining work
- record validation that actually ran
- adjust current milestone or focus if the work changed them
- note new risks, blockers, or deferrals when they appear

## Status Legend

- `[x]` complete and validated
- `[ ]` not started or not yet validated
- `[-]` intentionally deferred

## Current Snapshot

- Date: 2026-04-24
- Phase: Phase 1 core launch, web-first execution
- Current milestone: Launch-readiness hardening, with discovery, onboarding, and core hire operations now built and validated locally
- Current focus: finish the remaining browser QA honestly, then harden auth for launch-readiness before widening operations depth

## Milestone Board

### Phase 1 milestone ladder

- [x] Milestone 1: architecture, workspace, and shared persistence foundation
- [x] Milestone 2: public marketplace discovery surfaces on web
- [x] Milestone 3: creator and brand onboarding with local auth, session handling, and provider-first signup UX
- [x] Milestone 4: creator workspace plus brand-to-creator instant-hire operations shell
- [ ] Milestone 5: launch-readiness hardening through final browser QA, live provider checks, and auth hardening
- [ ] Milestone 6: post-launch operational depth for disputes, richer payout settlement, and broader admin automation

### Current milestone detail

- We are in Milestone 5.
- Milestones 1 through 4 are already represented in the shipped repo and backed by local build plus route-flow validation.
- Milestone 5 is not blocked by core product buildout anymore; it is now mostly QA, auth hardening, and environment-dependent provider verification.

## Weekly Execution Board

### Week of 2026-04-24

Completed this week:
- [x] refreshed the architecture docs so they describe the actual Next.js plus SQLite plus cookie-session system
- [x] aligned creator and brand onboarding around same-page modal signup flows
- [x] verified creator and brand onboarding error recovery and email disclosure behavior in the browser
- [x] verified Android vs iPhone provider presentation through user-agent checks
- [x] completed functional public-route QA across homepage, creators discovery, creator profile CTA routing, campaigns, and auth entry
- [x] tightened homepage responsive nav stacking and revalidated production build output
- [x] added local password reset and email verification flows with single-use hashed tokens, session invalidation on password reset, and non-production preview links for local validation

In progress this week:
- [ ] finish the remaining visual QA passes for creator workspace, hire, payout, notification, and admin routes
- [ ] lock the production delivery and deployment choices for auth emails and persistence

Blocked or external this week:
- [ ] live Google and Apple end-to-end verification depends on real provider credentials and callback configuration for the target environment
- [ ] physical-device confirmation for Apple visibility rules depends on real devices or equivalent emulation

Next queued work after the current slice:
- [ ] production-ready persistence and deployment session considerations
- [ ] production email delivery path for password reset and verification links
- [ ] dispute and payout workflow depth beyond the current shell

## Goals

### Near-term goals

- make creator discovery structurally complete on web
- preserve authenticity scoring, performance-first ranking, and instant hire as the product spine
- keep architecture docs and implementation state aligned
- only mark work complete after build, lint, and typecheck remain green

### Phase 1 product goal

- prove that brands can discover creators, hire quickly, and complete jobs end-to-end

## Completed Work

### Product direction and architecture

- [x] product narrowed to one platform only: reachfyp.com
- [x] worker and task-system concepts removed from architecture direction
- [x] frontend and backend stack locked for current phase
- [x] server-owned workflow boundaries documented
- [x] page maps and module architecture aligned to creator marketplace scope

### Workspace and scaffold

- [x] pnpm monorepo scaffold created
- [x] turborepo scripts wired for `build`, `lint`, and `typecheck`
- [x] Next.js web app scaffolded under `apps/web`
- [x] shared UI package active under `packages/ui`
- [x] dead provider-based Tamagui path removed from active web runtime
- [x] dead `packages/config` and `packages/tokens` scaffolding removed
- [x] deprecated shared TypeScript `baseUrl` setting removed from root config

### Current web implementation

- [x] homepage updated to reflect Week 4 kickoff
- [x] homepage redesigned into a premium pink-gradient marketplace landing page with search rail, signal cards, and featured creator cards
- [x] homepage hero tightened so the featured creators section appears earlier in the first viewport
- [x] homepage desktop hero compressed further so featured creators follows the search rail in the initial window view
- [x] homepage sizing now scales through viewport-responsive CSS variables and clamp-based rules instead of one-off screen tuning
- [x] homepage desktop and short-height viewports now compress hero and featured-card sizing together so the first featured row can peek in earlier on more laptop screens
- [x] homepage featured creators now render with remote creator photos instead of abstract-only placeholder art
- [x] homepage featured creator cards now use larger portrait-first imagery with pointer-responsive hover zoom
- [x] homepage hero title spacing now prevents the instant-hire headline from clipping on the landing page
- [x] featured and listing media now use a wider 8:5 card image treatment with badge rows split left and right below the image
- [x] homepage and listing surfaces now use an Airbnb-style coral-red accent system instead of the earlier pink-purple palette
- [x] homepage featured cards and creators listing now use taller image-led cards with dark image badges and simplified name-price-location rows inspired by the latest visual reference
- [x] theme toggle working with CSS-variable-based theme state
- [x] homepage, creators, profile, pricing, campaigns, and auth now use semantic theme tokens so light and dark modes both render from the same token system
- [x] auth now supports live brand and creator registration, sign-in, sign-out, and cookie-backed sessions
- [x] auth now supports single-use password reset and email verification flows for local email/password accounts, while provider signup marks email verified immediately
- [x] auth entry is now intent-aware: protected brand, creator, admin, and checkout routes land on role-specific auth states instead of one generic two-panel wall, and successful auth returns users to the exact route they started from
- [x] creator onboarding now begins with username selection on `/creator`, reserves the chosen handle server-side, and continues signup in a same-page modal instead of a detached signup route
- [x] brand onboarding now opens signup in a same-page modal on `/brand`, with legacy `/brand-signup` preserved only as a redirect bridge
- [x] Apple and Google OAuth are now wired for creator and brand signup flows, with provider failures routing back into the correct onboarding surface
- [x] signup UX is now provider-first, hides Apple on Android, and collapses the email form behind `Use email instead`
- [x] Google and Apple signup buttons now render with provider icons on both creator and brand signup surfaces
- [x] homepage nav actions now stack in a more intentional order on narrower widths so the join CTAs stay primary and secondary controls stop fragmenting the header
- [x] premium app-shell navigation now reflects signed-in account state and exposes sign-out outside the auth page
- [x] creator accounts can now create, update, and delete one owner-linked public creator profile at `/creator/profile`
- [x] creator accounts can now create, update, and delete public packages from the creator workspace
- [x] creator accounts can now connect, sync-mark, and disconnect public social accounts from the creator workspace
- [x] public creator packages now route into `/dashboard/instant-hire/[package_id]` and require an authenticated brand session at checkout entry
- [x] instant hire checkout now creates a local server-owned accepted hire record with tracking token and local escrow placeholder state
- [x] instant hire confirmation now atomically creates local hire detail, a hire-scoped conversation thread, and brand wallet hold ledger entries
- [x] brand dashboard now has live read surfaces at `/dashboard/hires/[hire_id]` and `/dashboard/messages/[conversation_id]` for the local instant-hire foundation
- [x] claimed creators now get live hire routes at `/creator/hires` and `/creator/hires/[hire_id]` with rebinding from previously synthetic seed participants
- [x] instant hire now supports local deliverable submission, revision requests, approvals, and escrow release/refund transitions through server-owned route handlers
- [x] brand queue now exists at `/dashboard/hires` with grouped queue states and surfaced notification context
- [x] creator queue and creator hire detail now prioritize next actions and link into payouts and threaded messaging
- [x] `/dashboard/notifications` now reads live notification events and supports mark-read plus mark-all-read actions
- [x] `/dashboard/messages/[conversation_id]` now supports participant replies and read-state updates
- [x] creator wallets now expose payout request history and submission at `/creator/payouts`
- [x] admin moderation and payout review surfaces now exist at `/admin/hires` and `/admin/payouts`
- [x] first live marketplace shell built at `/creators`
- [x] first live creator profile shell built at `/creators/[username]`
- [x] `/creators` and `/creators/[username]` now use the same premium responsive visual system as the homepage
- [x] creator cards and profile surfaces now render remote creator photos from backend-owned record data
- [x] creator listing and profile cards now use larger portrait-first imagery and keep badges outside the face area
- [x] `/creators` includes top nav, hero, results header, filter chips, creator grid, and creator cards
- [x] `/creators` exposes authenticity, performance, rating, and pricing context in card layout
- [x] `/creators/[username]` includes hero identity, score area, packages, portfolio, reviews, FAQ, and related creators
- [x] premium route shells now exist at `/pricing`, `/campaigns`, and `/auth`
- [x] marketplace navigation now points to live premium routes instead of missing placeholders
- [x] Next.js dev and production outputs now use separate dist directories so `next build` no longer corrupts the live dev server cache
- [x] marketplace query request/response contract defined in shared schemas
- [x] `/creators` now uses client-side filter state and sort state
- [x] `/creators` listing now loads through a real web route instead of page-owned in-file mock rendering
- [x] `/creators` now has loading, empty, and error states
- [x] `/creators` now supports load-more pagination
- [x] creator records are now served from the backend package instead of the app-local route slice
- [x] creator repository now persists records in a local SQLite database while preserving the existing marketplace/profile contracts
- [x] homepage links into the creators shell

### Validation completed

- [x] root `pnpm build` passes
- [x] root `pnpm lint` passes
- [x] root `pnpm typecheck` passes
- [x] stale deleted-package diagnostics flushed from the editor state

## In Progress

- [ ] visually QA the expanded creator workspace, hire, notification, payout, and admin surfaces in the running browser
- [ ] define the production delivery and persistence follow-up for the new auth recovery flows

## Remaining Work

### Browser QA still needed

- [ ] visually QA creators, creator profile, pricing, campaigns, and auth in the running browser and tune spacing or contrast where needed
- [ ] verify Android vs iOS provider presentation behavior on physical devices before closing the mobile-specific signup presentation work

### Phase 1 core launch work still ahead

- [ ] live-test Google and Apple signup end to end with real provider credentials and callback configuration
- [ ] auth hardening beyond the current local session foundation: production email delivery, deployment-ready persistence, and any stricter verified-email policy decisions
- [ ] dispute-oriented admin tooling beyond force release/refund
- [ ] richer payout settlement detail beyond request and review state
- [ ] broader browser-first visual polish across the onboarding and hire operations routes

### Deferred or intentionally not active yet

- [-] shared mobile runtime theming beyond current web needs
- [-] advanced analytics dashboards
- [-] disputes-heavy operational tooling
- [-] non-essential mobile breadth before Phase 1 web flow proves out

## Checklist

### Repo health checklist

- [x] active packages resolve cleanly
- [x] removed packages are no longer part of workspace scope
- [x] no live diagnostics remain in apps/packages after latest cleanup
- [x] architecture docs still match active implementation direction
- [x] progress tracker updated for the current milestone state

### Marketplace route checklist

- [x] route exists at `/creators`
- [x] route builds in production
- [x] route has static creator cards
- [x] route shows ranking-oriented messaging
- [x] route includes profile CTA path
- [x] profile target route exists
- [x] filters are interactive
- [x] sort is interactive
- [x] loading/empty/error states exist
- [x] backend-backed data is connected through the backend package repository
- [x] load-more behavior exists

### Release safety checklist

- [x] `pnpm build`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] route-level smoke test for `/creators/[username]`
- [x] route-level smoke test for `/pricing`
- [x] route-level smoke test for `/campaigns`
- [x] route-level smoke test for `/auth`
- [x] auth flow smoke test
- [x] creator profile CRUD smoke test
- [x] creator package CRUD smoke test
- [x] creator social sync smoke test
- [x] instant hire checkout smoke test
- [x] instant hire detail, conversation, and wallet-hold smoke test
- [x] hire flow smoke test
- [x] brand and creator hire index smoke test
- [x] notifications feed and mark-read smoke test
- [x] threaded message reply smoke test
- [x] creator payout request smoke test
- [x] admin moderation and payout review smoke test

## Validation Log

### Latest confirmed checks

- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm build"`
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm lint"`
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm typecheck"`
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm lint && pnpm typecheck"` passed after the premium routes and portrait image system were added
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web lint"` passed after the homepage redesign
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after clearing the stale `.next` cache following image-config changes
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after adding `/pricing`, `/campaigns`, `/auth`, and the interactive image-frame system
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after the homepage title-spacing fix and the new 8:5 badge-safe card media layout
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after separating Next dev output into `.next-dev` and production output into `.next-build`
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after the Airbnb coral theme shift and the taller image-led featured/listing card redesign
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after replacing hardcoded light-only UI colors with semantic theme tokens for working light and dark themes
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after replacing the seed-only creator repository with a SQLite-backed repository under the existing API contract
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after adding SQLite-backed auth users/sessions, auth routes, and session-aware premium navigation
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after adding owner-linked creator profile CRUD at `/creator/profile`
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after adding creator package CRUD and social connect/sync routes under the owner-scoped creator workspace
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after adding the brand-gated `/dashboard/instant-hire/[package_id]` checkout and local instant-hire record creation
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after extending instant hire into local hire detail, hire conversation bootstrap, and wallet hold ledger writes
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after adding creator-visible hire routes, deliverable submission/review actions, and local escrow release/refund transitions
- [x] 2026-04-24: `pnpm --filter @reachfyp/web build` passed after moving brand signup into the same-page `/brand?signup=1` flow and keeping `/brand-signup` as a compatibility redirect
- [x] 2026-04-24: browser QA confirmed creator and brand same-page signup modals open correctly, email disclosures expand on demand, and validation errors reopen the modal with the email form expanded
- [x] 2026-04-24: PowerShell `Invoke-WebRequest` with Android and iPhone user agents confirmed creator onboarding hides Apple on Android while keeping Google visible on both and Apple visible on iPhone
- [x] 2026-04-24: browserless public-route QA confirmed `/creators` filters and load-more behavior respond live, `/creators/[username]` hire CTAs route into checkout auth, `/campaigns` links into `/auth`, and `/auth?mode=register` renders the working register form
- [x] 2026-04-24: `pnpm --filter @reachfyp/web build` passed after tightening homepage responsive nav stacking and browser screenshots confirmed the join CTAs now lead the narrow header layout more cleanly
- [x] 2026-04-24: `pnpm --filter @reachfyp/web build` passed after adding `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, hashed one-time auth token storage, and password-reset session invalidation
- [x] 2026-04-24: browser QA validated email/password signup verification prompts, successful email verification consumption, generic forgot-password responses for existing and nonexistent emails, successful password reset, and rejection of reused reset tokens
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales && netstat -ano | findstr :3000"` confirmed localhost dev service was listening on port 3000 during route verification
- [x] 2026-04-23: `cmd /c "cd /d D:\marketingsales\apps\web && pnpm dev"` restarted cleanly after clearing stale Next outputs and served `/` successfully from the isolated dev cache
- [x] 2026-04-24: `http://localhost:3000/` served successfully from the restarted frontend dev server after the theming fixes
- [x] 2026-04-24: `http://localhost:3000/creators?cacheBust=db-repo-20260424` served the marketplace shell with the updated database-backed repository copy and live creator data
- [x] 2026-04-24: `POST /auth/register` followed by `GET /auth` rendered the signed-in state with the new account email in the running dev server session
- [x] 2026-04-24: `POST /auth/sign-out` returned `/auth` to the anonymous register/sign-in form state in the running dev server session
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after replacing the generic auth wall with intent-aware brand, creator, admin, and checkout auth entry states
- [x] 2026-04-24: `GET /pricing` with an authenticated session rendered the shared nav with the signed-in account name and sign-out action
- [x] 2026-04-24: `POST /auth/register` as a creator followed by `POST /creator/profile/save` rendered a new public creator page at `/creators/{username}` in the running dev server session
- [x] 2026-04-24: `GET /creator/profile` after save rendered the owner editor in update state with the public profile CTA in the running dev server session
- [x] 2026-04-24: `POST /creator/profile/delete` returned `/creator/profile` to the unpublished state in the running dev server session
- [x] 2026-04-24: `POST /creator/packages/save` after creator profile creation rendered the new package on `/creators/{username}` and in the owner workspace
- [x] 2026-04-24: `POST /creator/socials/connect` and `POST /creator/socials/sync` rendered the connected platform and fresh sync status on `/creators/{username}` and in the owner workspace
- [x] 2026-04-24: `POST /creator/packages/delete` and `POST /creator/socials/delete` removed the package and social account from the owner workspace cleanly
- [x] 2026-04-24: `GET /dashboard/instant-hire/{package_id}` without a session redirected into `/auth` with a working `redirectTo` return path
- [x] 2026-04-24: `POST /auth/register` as a brand with `redirectTo=/dashboard/instant-hire/{package_id}` returned the session directly to the instant-hire checkout page
- [x] 2026-04-24: `POST /dashboard/instant-hire/{package_id}/confirm` created the accepted local instant-hire record and rendered the local escrow placeholder plus tracking token state
- [x] 2026-04-24: `GET /dashboard/instant-hire/{package_id}` with a creator session rendered the brand-role boundary instead of allowing checkout entry
- [x] 2026-04-24: `POST /dashboard/instant-hire/{package_id}/confirm` redirected into `/dashboard/hires/{hire_id}` with a visible wallet hold summary and seeded conversation link
- [x] 2026-04-24: `GET /dashboard/messages/{conversation_id}` after hire creation rendered both the system kickoff message and the brand brief from checkout
- [x] 2026-04-24: `POST /creator/profile/save` with an unclaimed seed username rebound prior synthetic hire participation into the creator account and exposed the hire at `/creator/hires/{hire_id}`
- [x] 2026-04-24: `POST /creator/hires/{hire_id}/deliverables` submitted a creator deliverable, `POST /dashboard/hires/{hire_id}/lifecycle` requested a revision, and a second creator submission rendered as a new revision on the brand hire page
- [x] 2026-04-24: `POST /dashboard/hires/{hire_id}/lifecycle` with `action=approve` released held escrow to the creator wallet and `action=refund` returned held escrow to the brand wallet on a separate hire
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after adding brand/creator queues, notifications, threaded message replies, creator payouts, and admin moderation/payout routes
- [x] 2026-04-24: `cmd /c "cd /d D:\marketingsales && pnpm --filter @reachfyp/web build"` passed after the final queue, notifications, and payout/admin route hierarchy polish pass
- [x] 2026-04-24: browserless live QA validated grouped brand and creator queues, notification event generation, threaded brand replies, creator payout request submission, admin payout approval, and admin force-refund moderation using fresh local creator, brand, and admin sessions
- [x] 2026-04-23: `http://localhost:3000/?cacheBust=home-fold-20260423` rendered the two-line homepage hero with featured creators before the product signal cards
- [x] 2026-04-23: `http://localhost:3000/?cacheBust=home-window-featured-20260423` rendered the compressed desktop hero with featured creators immediately after the search rail
- [x] 2026-04-23: `http://localhost:3000/?cacheBust=home-systematic-responsive-20260423` rendered the viewport-responsive homepage layout with featured creators still before the product signal cards
- [x] 2026-04-23: `http://localhost:3000/?cacheBust=home-feature-peek-20260423` rendered the responsive fold-optimized homepage with featured creators still ahead of the signal cards
- [x] 2026-04-23: `http://localhost:3000/?cacheBust=home-photo-check-20260423` rendered the homepage with remote creator photos in the featured grid
- [x] 2026-04-23: `http://localhost:3000/creators?cacheBust=creators-photo-check-20260423` rendered the premium listing with remote creator photos and live marketplace controls
- [x] 2026-04-23: `http://localhost:3000/creators/aria-stone?cacheBust=profile-photo-check-20260423` rendered the premium creator profile with hero and related-creator photos
- [x] 2026-04-23: `http://localhost:3000/` returned the homepage successfully while port 3000 was live
- [x] 2026-04-23: `http://localhost:3000/pricing` rendered the premium pricing route
- [x] 2026-04-23: `http://localhost:3000/campaigns` rendered the premium campaigns route
- [x] 2026-04-23: `http://localhost:3000/auth` rendered the premium auth route shell
- [x] 2026-04-23: `GET http://localhost:3000/api/creators?page=1&pageSize=2` returned page 1 with 2 items and `nextPage=2`
- [x] 2026-04-23: `GET http://localhost:3000/api/creators?page=2&pageSize=2` returned page 2 with the remaining 2 items and `hasMore=false`
- [x] 2026-04-23: `GET http://localhost:3000/api/creators?filters=ugc&sort=price-low&page=1&pageSize=2` returned the filtered/sorted UGC slice
- [x] 2026-04-23: `GET http://localhost:3000/api/creators?previewState=empty&page=1&pageSize=2` returned the intended empty response contract
- [x] 2026-04-23: `GET http://localhost:3000/api/creators?previewState=error&page=1&pageSize=2` returned the intended 500 response for error-state verification
- [x] 2026-04-23: `http://localhost:3000/creators` rendered the marketplace shell with 2-of-4 load-more state
- [x] 2026-04-23: `http://localhost:3000/creators?previewState=empty` rendered the intended empty-state copy and clear-filters action
- [x] 2026-04-23: `http://localhost:3000/creators?previewState=error` rendered the intended error-state copy with retry and reset actions
- [x] 2026-04-23: `http://localhost:3000/creators/aria-stone` rendered the creator profile hero, packages, portfolio, reviews, FAQ, and related creators
- [x] 2026-04-23: `http://localhost:3000/` rendered the redesigned homepage hero, search rail, product-signal cards, and featured creator grid

### Validation notes

- after adding remote image config, `apps/web/.next` had to be deleted once before rerunning `next build`; the clean rebuild passed immediately afterward

### Manual checks still needed

- [x] open `/` and confirm homepage copy and CTA still match current milestone
- [ ] open `/` and verify the larger portrait cards, badge placement, and hover zoom feel right visually
- [ ] open `/creators` and verify filter toggles, sort changes, loading state, empty state, error recovery, load-more behavior, and portrait hover behavior visually
- [ ] open `/creators/[username]` and verify hero imagery, score cards, and related creators visually in-browser
- [ ] open `/pricing`, `/campaigns`, and `/auth` and tune copy or spacing after visual review if needed
- [x] manually verify `/creator` username lookup states, signup modal open/close behavior, provider-first layout, and recovery from signup errors in-browser
- [x] manually verify `/brand` same-page signup modal behavior, provider-first layout, and recovery from signup errors in-browser
- [ ] manually verify live Apple and Google signup once provider credentials are configured for the environment
- [x] manually verify Android hides Apple and iPhone shows both Apple and Google on the onboarding surfaces via server-rendered user-agent checks
- [x] manually verify email verification and password reset flows, including single-use token rejection and generic forgot-password responses, in-browser
- [ ] toggle light and dark themes across the live routes and verify contrast, surfaces, and interactive states visually
- [ ] manually verify the new signed-in nav state and auth feedback banners across `/auth`, `/creator`, `/brand`, `/pricing`, `/campaigns`, and `/creators`
- [ ] manually verify `/creator/profile` form spacing, feedback states, and role-boundary messaging in-browser
- [ ] manually verify package editing and social connect/sync/disconnect states inside `/creator/profile` in-browser
- [ ] manually verify `/dashboard/instant-hire/[package_id]` checkout spacing, role boundaries, and success state in-browser
- [ ] manually verify `/dashboard/hires/[hire_id]` and `/dashboard/messages/[conversation_id]` spacing, content hierarchy, and role boundaries in-browser
- [ ] manually verify `/creator/hires` and `/creator/hires/[hire_id]` spacing, revision feedback visibility, and submission states in-browser
- [ ] manually verify `/dashboard/hires`, `/dashboard/notifications`, `/creator/payouts`, `/admin/hires`, and `/admin/payouts` spacing, hierarchy, and moderation/payout form ergonomics in-browser

## Risks and Watchouts

- the current creator database is a local SQLite store bootstrapped from seed data; production-grade hosted persistence and multi-user operational hardening still remain future work
- the current auth system now includes local password reset and email verification flows, but production hardening still needs outbound email delivery, deployment-grade persistence/session decisions, and any stricter verified-email gating rules
- instant hire now writes local hire detail, deliverables, conversation, notifications, payout requests, and admin operations end-to-end, but deeper dispute tooling and settlement breadth still remain
- seeded marketplace creators still begin with synthetic local participant IDs until claimed, but claiming the matching seed username now rebinds prior hires, conversations, deliverables, and wallet ownership into the real creator account
- root Turbo validation is reliable when run through `cmd /c` in this Windows workspace
- reused PowerShell shells can show misleading `Terminate batch job` prompts during parallel command execution

## Next Update Trigger

Update this file immediately when any of the following changes:
- a checklist item moves from not started to complete
- a route is added or removed
- a validation command fails or passes after a meaningful change
- a task is deferred or blocked
- current milestone changes