# Page Maps - reachfyp.com

This file records the currently implemented web route map in the repo.

Single platform only. No worker or task domain.

---

## Public Pages (no login required)

| Route | Page | Purpose |
|---|---|---|
| / | Homepage | Marketplace positioning and featured creators |
| /pricing | Pricing | Fees and marketplace positioning |
| /campaigns | Campaigns | Public campaign shell |
| /creators | Creator Marketplace | Search/filter creators and browse rankings |
| /creators/[username] | Creator Profile | Public profile, packages, reviews, FAQ, related creators |
| /auth | Shared Auth Entry | Role-aware sign-in/register surface and redirect recovery |
| /auth/forgot-password | Forgot Password | Generic password reset request surface |
| /auth/reset-password | Reset Password | Token redemption surface for choosing a new password |
| /creator | Creator Onboarding | Username-first creator landing page with same-page signup modal |
| /creator-signup | Legacy Creator Signup Redirect | Redirects back into `/creator?...&signup=1` |
| /brand | Brand Onboarding | Brand landing page with same-page signup modal |
| /brand-signup | Legacy Brand Signup Redirect | Redirects back into `/brand?signup=1` |

---

## Auth and System Routes

| Route | Type | Purpose |
|---|---|---|
| /auth/register | POST | Email/password registration for creator and brand accounts |
| /auth/sign-in | POST | Email/password sign-in |
| /auth/sign-out | POST | Session invalidation |
| /auth/forgot-password/request | POST | Generic password reset request handler |
| /auth/reset-password/update | POST | Password reset token redemption handler |
| /auth/verify-email | GET | Email verification token redemption |
| /auth/verify-email/request | POST | Signed-in resend verification action |
| /auth/apple/start | GET | Apple OAuth kickoff |
| /auth/apple/callback | GET/POST | Apple OAuth completion |
| /auth/google/start | GET | Google OAuth kickoff |
| /auth/google/callback | GET | Google OAuth completion |

Routing rules:
- `/creator?username=...&signup=1` opens the creator signup modal on the landing page
- `/brand?signup=1` opens the brand signup modal on the landing page
- signup errors route back to the originating onboarding surface instead of a detached auth wall
- `/auth/forgot-password` returns the same success copy whether or not the submitted email exists
- local non-production builds may surface preview links for verification and password reset until real email delivery is configured

---

## Brand Surfaces (auth required, role: brand)

| Route | Page | Purpose |
|---|---|---|
| /dashboard/instant-hire/[packageId] | Instant Hire Checkout | Confirm package, brand role boundary, and checkout state |
| /dashboard/instant-hire/[packageId]/confirm | POST | Creates local hire, wallet hold, and kickoff thread |
| /dashboard/hires | Brand Hire Queue | Grouped brand-side hire operations |
| /dashboard/hires/[hireId] | Hire Detail | Review deliverables, hire state, escrow placeholder, and context |
| /dashboard/hires/[hireId]/lifecycle | POST | Revision, approve, refund, and moderation-affecting transitions |
| /dashboard/messages/[conversationId] | Conversation | Brand-thread view and replies |
| /dashboard/messages/[conversationId]/reply | POST | Conversation reply action |
| /dashboard/notifications | Notifications Feed | Brand notification stream |
| /dashboard/notifications/read | POST | Mark single or multiple notifications read |

---

## Creator Surfaces (auth required, role: creator)

| Route | Page | Purpose |
|---|---|---|
| /creator/profile | Creator Profile Workspace | Create, edit, preview, and publish the creator profile |
| /creator/profile/save | POST | Save creator profile |
| /creator/profile/delete | POST | Delete creator profile |
| /creator/packages/save | POST | Create or update a package |
| /creator/packages/delete | POST | Delete a package |
| /creator/socials/connect | POST | Mark social connection state |
| /creator/socials/sync | POST | Run local sync/update flow |
| /creator/socials/delete | POST | Remove a connected social entry |
| /creator/hires | Creator Hire Queue | Creator-side delivery work queue |
| /creator/hires/[hireId] | Hire Detail | Creator submission, revision, and message context |
| /creator/hires/[hireId]/deliverables | POST | Deliverable submission |
| /creator/payouts | Creator Payout Workspace | Request history and payout status |
| /creator/payouts/request | POST | Submit payout request |

---

## Admin Surfaces (auth required, role: admin)

| Route | Page | Purpose |
|---|---|---|
| /admin/hires | Hire Moderation Queue | Review active hires and moderation actions |
| /admin/hires/[hireId]/moderate | POST | Force release/refund and moderation state changes |
| /admin/payouts | Payout Review Queue | Review creator payout requests |
| /admin/payouts/[payoutRequestId]/review | POST | Approve or reject payout requests |

---

## Current Navigation Model

### Public Navigation
- Logo
- Creators
- Campaigns
- Pricing
- For brands
- For creators
- Login
- Primary CTA

### Creator Onboarding Navigation Behavior
- Username input is part of the landing page, not a detached registration route
- Signup opens in a modal state on the same `/creator` page
- Social auth buttons are primary; email is a disclosure fallback

### Brand Onboarding Navigation Behavior
- Signup opens in a modal state on the same `/brand` page
- Social auth buttons are primary; email is a disclosure fallback

### Admin and Operations Navigation
- The current repo ships focused route-level operations, not a full admin shell index yet
