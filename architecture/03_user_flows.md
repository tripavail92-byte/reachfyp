# User Flows

---

## 1. Creator Flow

### Onboarding
1. Creator lands on `/creator` and enters the desired public username first
2. System checks username availability and returns a status such as `available`, `claimable`, or `taken`
3. If the username can be claimed, the same page reopens in signup state at `/creator?username=...&signup=1`
4. Creator signs up from the in-page modal using one of these paths:
   - Google
   - Apple
   - email/password behind `Use email instead`
5. Apple is hidden on Android devices; iOS users can see both Google and Apple
6. The server creates or upserts the auth account and stores the chosen handle in `reserved_creator_username`
7. Email/password signup issues a verification token; Google and Apple signup paths mark the email as verified immediately
8. Creator is redirected into `/creator/profile?claimedUsername=...`
9. Creator completes profile:
   - photo, bio, niche, location, languages
   - social account connect
   - portfolio items
10. Creator creates the first package and can enable instant hire
11. Public creator route goes live at `/creators/[username]`
12. Optional: creator requests verification and admin reviews

### Getting Hired (Instant Hire)
1. Brand finds creator in marketplace sorted by ranking_score
2. Brand sees authenticity badges directly on the listing card (Real Engagement, Verified Audience, Top Performer)
3. Brand opens creator profile and reviews authenticity metrics panel and tracking performance stats
4. Brand selects a package and clicks "Hire Instantly"
5. Brand confirms: package details, agreed price, delivery deadline
6. Brand confirms payment (wallet balance deducted into escrow in one atomic step)
7. Hire is created with hire_type: instant and status: accepted
8. Tracking link is auto-generated for this hire
9. Creator receives immediate notification with brief, deadline, and access to messaging thread
10. Creator begins work — no back-and-forth acceptance step
11. Creator submits deliverable
12. Brand approves and escrow releases to creator wallet
13. Tracking events update creator performance_score and ranking_score

### Applying to a Campaign
1. Creator browses open campaigns
2. Filters by niche, platform, budget, objective
3. Creator submits application (message + proposed price + package)
4. Brand accepts or rejects application
5. If accepted, hire is created and deliverable workflow begins

---

## 2. Brand Flow

### Onboarding
1. Brand lands on `/brand`
2. Primary CTA opens in-page signup state at `/brand?signup=1`
3. Brand signs up from the in-page modal using one of these paths:
   - Google
   - Apple
   - email/password behind `Use email instead`
4. Apple is hidden on Android devices; iOS users can see both Google and Apple
5. Brand account is created with team identity fields such as full name and company name
6. Email/password signup issues a verification token; Google and Apple signup paths mark the email as verified immediately
7. Successful signup redirects directly into creator discovery surfaces
8. Optional brand profile, payment, and campaign detail expansion remains follow-up work

### Discovering and Hiring Creators
1. Brand searches creator marketplace
2. Brand applies filters: platform, niche, price range, verified status
3. Results are sorted by ranking_score by default
4. Each creator card shows: ranking badges (Real Engagement / Verified Audience / Top Performer), authenticity score, performance score, niche tags, and starting price
5. Brand opens creator profile to see full authenticity breakdown:
   - Authenticity Score with signal summary
   - Audience Quality Score
   - Growth Anomaly indicator
   - Past campaign performance (clicks, conversions from tracking)
6. Brand hires instantly from package or sends a custom offer
7. Escrow hold is placed on brand wallet
8. Deliverable workflow starts

### Running Campaigns
1. Brand creates campaign with objective, budget, platforms, timeline, and deliverables
2. Campaign is published with status: open
3. Creators apply to campaign
4. Brand reviews and accepts applications
5. Accepted applications become hires
6. Brand manages hires and tracking outcomes from campaign dashboard

### Managing Deliverables and Results
1. Brand reviews submitted deliverables
2. Brand approves, requests revision, or rejects
3. Approved deliverables release escrow funds
4. Brand monitors tracking links by creator:
   - clicks
   - conversions
   - traffic quality

---

## 3. Admin Flow

### User and Trust Management
1. Admin manages users by role, status, and geography
2. Admin verifies creators and can suspend accounts
3. Admin reviews audit logs and role changes

### Metrics and Ranking Oversight
1. Admin monitors creator_metrics recalculation jobs
2. Admin reviews authenticity anomalies (growth spikes, low audience quality)
3. Admin can trigger manual recalculation of ranking_score

### Disputes and Payouts
1. Admin resolves disputes on hires
2. Admin executes fund resolution (release, refund, split)
3. Admin processes creator payout requests

### Platform Analytics
1. Admin tracks marketplace health:
   - new creators/brands
   - hire conversion rate
   - delivery approval rate
   - payout throughput
   - tracking quality signals

---

## 4. Shared Flows

### Auth and Onboarding Routing
1. `/creator-signup` is now a compatibility redirect, not the primary creator signup page
2. `/brand-signup` is now a compatibility redirect, not the primary brand signup page
3. Creator signup errors reopen the creator modal on `/creator?...&signup=1`
4. Brand signup errors reopen the brand modal on `/brand?signup=1`
5. Apple and Google callback failures return users to the same onboarding surface they started from

### Password Recovery
1. User opens `/auth/forgot-password`
2. User enters an email address and receives a generic success response whether or not the account exists
3. If the account exists, the server creates a single-use password reset token with expiry
4. User opens `/auth/reset-password?token=...`
5. User enters and confirms a new password
6. Successful reset invalidates active sessions for that user
7. User signs in again through the normal auth flow

### Email Verification
1. Email/password signup issues a single-use verification token after account creation
2. Signed-in accounts that are still unverified can request a new verification link from `/auth`
3. User opens `/auth/verify-email?token=...`
4. Successful verification sets `email_verified_at` on the auth account and invalidates any outstanding verification tokens for that user

### Messaging
1. Conversation is created when:
   - brand sends custom offer
   - creator applies to campaign
   - a hire starts
2. Brand and creator communicate in threaded chat
3. Admin can view conversations for moderation

### Notifications
Events that trigger notifications:
- creator username claim or signup failure recovery messaging in onboarding UI
- application received / accepted / rejected
- instant hire created
- deliverable submitted / approved / rejected / revision requested
- new message received
- payout processed
- dispute opened / resolved
- social account connected / sync failed
- verification approved / rejected

### Wallet and Escrow
Hire created:
1. Brand wallet: balance decreases and held_balance increases
2. Transaction type: escrow_hold

Deliverable approved:
1. Brand wallet: held_balance decreases
2. Creator wallet: balance increases
3. Transaction types: escrow_release and payout

Hire cancelled before work:
1. Held funds return to brand balance
2. Transaction type: refund

---

## 5. Trust and Ranking Flows

### Creator Authenticity Score Computation
Triggered after every social sync and on a daily recalculation job.

Signals ingested:
- `engagement_rate`: (likes + comments + saves) / followers, per connected platform
- `comment_quality_ratio`: NLP-classified meaningful comments vs spam/generic
- `growth_anomaly_score`: follower delta vs engagement delta; divergence = bot risk
- `posting_consistency`: standard deviation of posts per week over 90 days
- `cross_platform_verified`: all connected handles confirmed via OAuth

Badge thresholds:
- **Real Engagement** badge: authenticity_score >= 75
- **Verified Audience** badge: audience_quality_score >= 80
- **Top Performer** badge: performance_score >= 80
- **Rising** badge: growth_anomaly_score <= 20 AND positive follower growth > 10% in 30 days

Badges are computed at query time from stored scores, not stored separately.

### Performance Score Computation
Triggered after every tracking event batch flush (near real-time).

Signals used:
- Total clicks from tracking links attributed to this creator
- Conversion rate (conversions / clicks)
- Average `quality_score` across tracking events (filters bot traffic)

This score reflects real-world results across all campaigns, not self-reported metrics.

### Smart Marketplace Ranking
Default sort on /creators and /creators/ranked.

Formula:
```
ranking_score =
  (performance_score  * 0.35) +
  (authenticity_score * 0.25) +
  (delivery_quality   * 0.20) +
  (audience_quality   * 0.10) +
  (avg_review_rating  * 0.10)
```

Key rule: follower count is NOT a ranking factor. A creator with 5K followers and high conversion performance ranks above a creator with 100K followers and no tracking history.

Ranking_score decays by a staleness factor if not recalculated within 7 days, ensuring the marketplace reflects current performance.
