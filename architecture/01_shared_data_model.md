# Shared Data Model

All tables live in one database for one product: reachfyp.com (creator marketplace).

## Current Implementation Snapshot

- The active persistence layer in this repo is local SQLite, not hosted Postgres.
- Auth and marketplace records currently live in the same shared database foundation.
- The shipped account model uses `auth_users`, `auth_sessions`, `auth_password_reset_tokens`, and `auth_email_verification_tokens`.
- Public creator usernames are not assigned at anonymous browse time. A creator first reserves a username during onboarding, then consumes that username when completing the creator profile flow.

## Data Access Model

Use these access classes across web and mobile.

- `public_read`: safe for marketplace/public profile reads through RLS or cached app endpoints
- `owner_write`: user may write only their own rows under strict RLS
- `server_write`: writes must go through the application server layer only
- `admin_write`: writes restricted to admin/server actions

This model exists to prevent direct client ownership of financial, trust, ranking, and admin workflows.

---

## Core Entities

### auth_users
Current shipped auth/account table.

| field | type | notes |
|---|---|---|
| id | text | primary key |
| name | text | display name collected at signup |
| company_name | text | nullable, mainly used for brand signup |
| reserved_creator_username | text | unique nullable reservation for creator onboarding before profile completion |
| apple_subject | text | unique nullable Apple OAuth subject |
| google_subject | text | unique nullable Google OAuth subject |
| email | text | unique |
| email_verified_at | text | nullable ISO timestamp set after verification or trusted provider signup |
| password_hash | text | stored for email/password auth |
| role | enum text | brand / creator / admin |
| created_at | text | ISO timestamp |

Access class:
- `server_write`

Notes:
- Current implementation stores one active role per auth account row.
- `reserved_creator_username` is used to lock a creator handle before the public profile exists.
- Provider subject columns support idempotent Apple and Google auth upserts.
- Email/password signups remain unverified until the verification token is redeemed.
- Apple and Google signup paths currently mark `email_verified_at` during provider upsert.

---

### auth_sessions
Current shipped session table.

| field | type | notes |
|---|---|---|
| token_hash | text | primary key; hashed session token |
| user_id | text | FK → auth_users |
| expires_at | text | ISO timestamp |
| created_at | text | ISO timestamp |

Access class:
- `server_write`

Notes:
- Browser sessions are delivered through the `reachfyp_session` cookie.
- The raw session token is never stored directly; only the hash is persisted.

---

### auth_password_reset_tokens
Current shipped password reset token table.

| field | type | notes |
|---|---|---|
| token_hash | text | primary key; hashed opaque reset token |
| user_id | text | FK → auth_users |
| expires_at | text | ISO timestamp |
| created_at | text | ISO timestamp |
| used_at | text | nullable ISO timestamp; set on redemption |

Access class:
- `server_write`

Notes:
- Tokens are single use and short lived.
- The raw token is only returned to the route layer for delivery handling and is never persisted directly.
- Password reset invalidates existing sessions for the user after the password changes.

---

### auth_email_verification_tokens
Current shipped email verification token table.

| field | type | notes |
|---|---|---|
| token_hash | text | primary key; hashed opaque verification token |
| user_id | text | FK → auth_users |
| expires_at | text | ISO timestamp |
| created_at | text | ISO timestamp |
| used_at | text | nullable ISO timestamp; set on redemption |

Access class:
- `server_write`

Notes:
- Verification tokens are single use and short lived.
- Email/password registration issues a verification token immediately after account creation.
- Non-production builds may surface preview links while real outbound email delivery remains a deployment concern.

---

### users
Planned normalized account entity for future expansion. This is not the current auth table in the repo today.

| field | type | notes |
|---|---|---|
| id | uuid | primary key |
| email | varchar | unique |
| password_hash | varchar | |
| full_name | varchar | |
| username | varchar | unique |
| avatar_url | varchar | |
| country | varchar | |
| timezone | varchar | |
| status | enum | active / suspended / pending_review |
| email_verified | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

Access class:
- `owner_write` for basic self-service profile fields through approved endpoints
- `admin_write` for status changes and restricted account operations

---

### user_roles
One user can hold multiple roles.

| field | type | notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → users |
| role | enum | brand / creator / admin |
| is_active | boolean | |
| granted_at | timestamp | |

Access class:
- `admin_write`

---

### creator_profiles
| field | type | notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → users (1:1) |
| bio | text | |
| niche | varchar[] | array of tags |
| location | varchar | |
| languages | varchar[] | |
| profile_visibility | enum | public / private |
| verification_status | enum | unverified / pending / verified |
| quality_score | decimal | 0-100 delivery/review quality |
| avg_rating | decimal | |
| review_count | integer | |
| total_campaigns_completed | integer | |
| is_featured | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

Access class:
- `public_read`
- `owner_write`

Current username claim note:
- Creator public identity is route-bound to `/creators/[username]`.
- During onboarding, a username is checked first and stored in `auth_users.reserved_creator_username`.
- When the creator completes profile setup, that reserved username is consumed into the public creator record and can then power profile rebinding for claimed seed creators.

---

### creator_social_links
| field | type | notes |
|---|---|---|
| id | uuid | |
| creator_id | uuid | FK → creator_profiles |
| platform | enum | instagram / tiktok / youtube / x / facebook / other |
| handle | varchar | |
| profile_url | varchar | |
| follower_count | integer | auto-sync after OAuth connect |
| engagement_rate | decimal | auto-sync metric |
| post_count | integer | auto-sync metric |
| is_verified | boolean | verified by platform OAuth |
| connected_at | timestamp | |
| verified_at | timestamp | |

Access class:
- `owner_write` for connect/disconnect and read access to own accounts
- `server_write` for synced metrics and verification fields

---

### creator_metrics
Authenticity and performance metrics. The primary engine that separates reachfyp from follower-based marketplaces.

| field | type | notes |
|---|---|---|
| id | uuid | |
| creator_id | uuid | FK → creator_profiles, unique |
| authenticity_score | decimal | 0-100 composite, displayed on public profile |
| avg_views | decimal | rolling 90-day average views per post |
| engagement_rate | decimal | (likes+comments+saves) / followers, per platform |
| audience_quality_score | decimal | 0-100 ratio of real vs suspected bot followers |
| growth_anomaly_score | decimal | 0-100 spike risk score, higher = more suspicious |
| performance_score | decimal | 0-100 computed from tracking outcomes |
| ranking_score | decimal | final weighted score used as marketplace sort default |
| scoring_signals | jsonb | raw input snapshot used to compute scores |
| last_calculated_at | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

Access class:
- `public_read`
- `server_write`

Scoring signal keys stored in `scoring_signals`:
- `follower_growth_rate`: percentage change over last 30 days
- `engagement_consistency`: variance across last 30 posts
- `comment_quality_ratio`: meaningful comments vs generic/spam
- `cross_platform_verified`: boolean, handle confirmed on all connected platforms
- `posting_frequency`: posts per week, rolling 90 days
- `tracking_clicks_30d`: raw click volume from platform tracking links
- `tracking_conversion_30d`: conversions attributed to creator
- `traffic_quality_avg`: average quality_score across all tracking events
- `delivery_on_time_rate`: from campaign_hires history
- `revision_rate`: revisions requested divided by deliverables submitted
- `avg_review_rating`: from reviews table

---

### creator_packages
| field | type | notes |
|---|---|---|
| id | uuid | |
| creator_id | uuid | FK → creator_profiles |
| title | varchar | e.g. "Instagram Reel" |
| description | text | |
| platform | enum | instagram / tiktok / youtube / etc |
| content_type | enum | reel / story / post / video / ugc / review / custom |
| price | decimal | |
| currency | varchar | default USD |
| delivery_days | integer | |
| revisions | integer | |
| requirements | text | what brand must provide |
| instant_hire_enabled | boolean | default true |
| is_active | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

Access class:
- `public_read`
- `owner_write`

---

### creator_portfolio
| field | type | notes |
|---|---|---|
| id | uuid | |
| creator_id | uuid | FK → creator_profiles |
| title | varchar | |
| media_url | varchar | image/video URL |
| external_url | varchar | link to live post |
| platform | varchar | |
| created_at | timestamp | |

Access class:
- `public_read`
- `owner_write`

---

### campaigns
| field | type | notes |
|---|---|---|
| id | uuid | |
| brand_id | uuid | FK → users |
| title | varchar | |
| objective | varchar | awareness / traffic / conversions / ugc |
| description | text | |
| budget | decimal | |
| currency | varchar | |
| platforms | varchar[] | |
| niche | varchar[] | |
| deliverables | text | |
| timeline_start | date | |
| timeline_end | date | |
| requirements | text | |
| status | enum | draft / open / in_progress / completed / cancelled |
| created_at | timestamp | |
| updated_at | timestamp | |

Access class:
- `public_read` for open/public campaign surfaces
- `owner_write` for brand-owned creation and editing through approved endpoints

---

### campaign_applications
| field | type | notes |
|---|---|---|
| id | uuid | |
| campaign_id | uuid | FK → campaigns |
| creator_id | uuid | FK → creator_profiles |
| package_id | uuid | FK → creator_packages (optional) |
| message | text | |
| proposed_price | decimal | |
| status | enum | pending / accepted / rejected / withdrawn |
| applied_at | timestamp | |
| reviewed_at | timestamp | |

Access class:
- `owner_write` for creator apply/withdraw and brand review through approved endpoints
- `server_write` for acceptance side effects that create hires

---

### campaign_hires (active engagements)
| field | type | notes |
|---|---|---|
| id | uuid | |
| campaign_id | uuid | FK → campaigns, nullable for direct package hire |
| creator_id | uuid | FK → creator_profiles |
| package_id | uuid | FK → creator_packages |
| brand_id | uuid | FK → users |
| hire_type | enum | instant / application / invite |
| agreed_price | decimal | |
| currency | varchar | |
| status | enum | invited / accepted / in_progress / submitted / revision_requested / approved / completed / disputed / cancelled |
| hired_at | timestamp | |
| deadline | timestamp | |
| completed_at | timestamp | |

Access class:
- `server_write`
- read access allowed to the participating brand, creator, and admin

---

### deliverables
| field | type | notes |
|---|---|---|
| id | uuid | |
| hire_id | uuid | FK → campaign_hires |
| title | varchar | |
| description | text | |
| file_urls | varchar[] | uploaded files |
| external_url | varchar | live post URL |
| notes | text | creator notes |
| status | enum | pending / submitted / approved / rejected / revision_requested |
| submitted_at | timestamp | |
| reviewed_at | timestamp | |
| reviewer_id | uuid | FK → users |
| feedback | text | brand/admin feedback |
| revision_count | integer | |

Access class:
- `owner_write` for creator submission payloads on their own hire
- `server_write` for review state changes and approval/rejection workflow

---

### conversations
| field | type | notes |
|---|---|---|
| id | uuid | |
| type | enum | direct / campaign / hire |
| reference_id | uuid | campaign_id or hire_id |
| participant_ids | uuid[] | |
| last_message_at | timestamp | |
| created_at | timestamp | |

Access class:
- `server_write` for conversation creation
- participant-scoped read access

---

### messages
| field | type | notes |
|---|---|---|
| id | uuid | |
| conversation_id | uuid | FK → conversations |
| sender_id | uuid | FK → users |
| content | text | |
| media_urls | varchar[] | |
| read_at | timestamp | |
| created_at | timestamp | |

Access class:
- `owner_write` within authorized conversations

---

### wallet_accounts
| field | type | notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → users (1:1) |
| balance | decimal | current available balance |
| held_balance | decimal | funds in escrow |
| currency | varchar | |
| updated_at | timestamp | |

Access class:
- `server_write`
- read access only to wallet owner and admin

---

### wallet_transactions
| field | type | notes |
|---|---|---|
| id | uuid | |
| wallet_id | uuid | FK → wallet_accounts |
| type | enum | deposit / withdrawal / escrow_hold / escrow_release / payout / refund / admin_adjustment |
| amount | decimal | |
| direction | enum | credit / debit |
| reference_type | varchar | campaign_hire / payout / dispute |
| reference_id | uuid | |
| note | text | |
| created_by | uuid | user or system |
| created_at | timestamp | |

Access class:
- `server_write`
- read access only to wallet owner and admin

---

### payouts
| field | type | notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → users |
| amount | decimal | |
| method | enum | bank_transfer / paypal / wise / crypto / etc |
| payout_details | jsonb | masked destination info |
| status | enum | pending / processing / completed / failed |
| requested_at | timestamp | |
| processed_at | timestamp | |
| admin_id | uuid | who approved |

Access class:
- creator can submit payout request through approved endpoint
- `server_write` for status changes and payment processing

---

### notifications
| field | type | notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → users |
| type | varchar | new_message / application_accepted / hire_started / payout_processed / etc |
| title | varchar | |
| body | text | |
| data | jsonb | link/context |
| read | boolean | |
| created_at | timestamp | |

Access class:
- `server_write` for creation
- `owner_write` for marking own notifications as read

---

### reviews
| field | type | notes |
|---|---|---|
| id | uuid | |
| reviewer_id | uuid | FK → users |
| reviewee_id | uuid | FK → users |
| reference_type | enum | campaign_hire |
| reference_id | uuid | |
| rating | integer | 1-5 |
| comment | text | |
| created_at | timestamp | |

Access class:
- `owner_write` for allowed post-hire review creation
- `admin_write` for moderation/removal

---

### tracking_links
| field | type | notes |
|---|---|---|
| id | uuid | |
| campaign_id | uuid | FK → campaigns, nullable |
| hire_id | uuid | FK → campaign_hires |
| creator_id | uuid | FK → creator_profiles |
| short_code | varchar | unique |
| destination_url | varchar | |
| clicks | integer | denormalized counter |
| conversions | integer | denormalized counter |
| unique_clicks | integer | denormalized counter |
| created_at | timestamp | |

Access class:
- `server_write`
- read access to participating brand, creator, and admin

---

### tracking_events
| field | type | notes |
|---|---|---|
| id | uuid | |
| link_id | uuid | FK → tracking_links |
| event_type | enum | click / conversion |
| ip_address | inet | |
| user_agent | text | |
| referrer | varchar | |
| country | varchar | |
| quality_score | decimal | traffic quality score (0-100) |
| created_at | timestamp | |

Access class:
- `server_write`

---

### audit_logs
| field | type | notes |
|---|---|---|
| id | uuid | |
| actor_id | uuid | FK → users |
| action | varchar | |
| target_type | varchar | |
| target_id | uuid | |
| metadata | jsonb | before/after snapshot |
| ip_address | inet | |
| created_at | timestamp | |

Access class:
- `server_write`
- admin read only

---

### disputes
| field | type | notes |
|---|---|---|
| id | uuid | |
| hire_id | uuid | FK → campaign_hires |
| opened_by | uuid | FK → users |
| reason | text | |
| status | enum | open / under_review / resolved / closed |
| resolution | enum | release_funds / refund_brand / split_payment |
| admin_id | uuid | |
| resolved_at | timestamp | |
| created_at | timestamp | |

Access class:
- participants can open disputes through approved endpoints
- `server_write` for resolution and final state changes
