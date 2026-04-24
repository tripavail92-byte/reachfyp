# User Roles and Permissions

---

## Role Definitions

| Role | Purpose | Product Area |
|---|---|---|
| brand | Posts campaigns, hires creators, manages deliverables and payments | reachfyp marketplace |
| creator | Builds profile, connects socials, sells packages, delivers work | reachfyp marketplace |
| admin | Full system access, trust and payout controls, moderation | reachfyp platform |

A single user account can hold multiple roles simultaneously.
Example: a creator can also be a brand.

Current implementation note:
- The shipped auth table currently stores one active role per `auth_users` row.
- Multi-role activation remains an architectural direction, not an implemented capability in this repo yet.

---

## Permission Matrix

### auth
| action | brand | creator | admin |
|---|---|---|---|
| register | ✓ | ✓ | — |
| login | ✓ | ✓ | ✓ |
| request password reset | ✓ | ✓ | ✓ |
| verify email address | ✓ | ✓ | ✓ |
| change password | ✓ | ✓ | ✓ |
| delete own account | ✓ | ✓ | — |

---

### creator profiles and social connect
| action | brand | creator | admin |
|---|---|---|---|
| view public profile | ✓ | ✓ | ✓ |
| create own profile | — | ✓ | ✓ |
| edit own profile | — | ✓ | ✓ |
| connect social accounts (OAuth) | — | ✓ | ✓ |
| sync social metrics | — | ✓ | ✓ |
| view all creator profiles | — | — | ✓ |
| verify a creator | — | — | ✓ |
| suspend a creator | — | — | ✓ |

---

### creator packages and instant hire
| action | brand | creator | admin |
|---|---|---|---|
| view packages | ✓ | ✓ | ✓ |
| create/edit own packages | — | ✓ | — |
| delete own package | — | ✓ | — |
| enable/disable instant hire on package | — | ✓ | ✓ |
| hire instantly from package | ✓ | — | ✓ |
| deactivate any package | — | — | ✓ |

---

### campaigns
| action | brand | creator | admin |
|---|---|---|---|
| post a campaign | ✓ | — | ✓ |
| edit own campaign | ✓ | — | ✓ |
| cancel own campaign | ✓ | — | ✓ |
| view open campaigns | ✓ | ✓ | ✓ |
| apply to campaign | — | ✓ | — |
| accept/reject application | ✓ | — | ✓ |
| view all campaigns | — | — | ✓ |

---

### campaign hires and deliverables
| action | brand | creator | admin |
|---|---|---|---|
| submit deliverable | — | ✓ | — |
| request revision | ✓ | — | ✓ |
| approve deliverable | ✓ | — | ✓ |
| reject deliverable | ✓ | — | ✓ |
| view hire status | ✓ | ✓ | ✓ |
| cancel hire | ✓ | — | ✓ |
| raise dispute | ✓ | ✓ | — |

---

### wallet and payouts
| action | brand | creator | admin |
|---|---|---|---|
| view own balance | ✓ | ✓ | ✓ |
| deposit funds | ✓ | — | — |
| request payout | — | ✓ | — |
| view own transactions | ✓ | ✓ | ✓ |
| view all wallets | — | — | ✓ |
| manual balance adjustment | — | — | ✓ (logged) |
| approve payout | — | — | ✓ |

---

### messaging
| action | brand | creator | admin |
|---|---|---|---|
| send message | ✓ | ✓ | ✓ |
| read own messages | ✓ | ✓ | ✓ |
| read any conversation | — | — | ✓ |

---

### reviews and ranking
| action | brand | creator | admin |
|---|---|---|---|
| leave review after completed hire | ✓ | ✓ | — |
| view creator authenticity metrics | ✓ | ✓ | ✓ |
| view creator performance metrics | ✓ | ✓ | ✓ |
| recalculate ranking score | — | — | ✓ |
| delete any review | — | — | ✓ |

---

### admin
| action | brand | creator | admin |
|---|---|---|---|
| access admin panel | — | — | ✓ |
| suspend any user | — | — | ✓ |
| resolve disputes | — | — | ✓ |
| view audit logs | — | — | ✓ |
| manage verification | — | — | ✓ |
| view platform analytics | — | — | ✓ |

---

## Role Assignment Flow

### At Registration
User picks their primary role:
- "I'm a brand" → role: brand
- "I'm a creator" → role: creator

### Adding a Second Role
This remains planned, not implemented.

Current repo behavior:
- A user signs up as either `brand` or `creator`.
- Admin is assigned separately.
- Converting one live account into a multi-role account is deferred.

### Admin Assignment
Admin role is never self-assigned. It is granted directly in the database by a super-admin or via a seeded admin bootstrap script.

---

## Auth Strategy

- Cookie-backed session authentication using the `reachfyp_session` cookie
- Session records are stored in `auth_sessions`; only hashed session tokens are persisted
- Account records are stored in `auth_users` with a single current role per row and `email_verified_at` when verification is complete
- Signup supports email/password for brand and creator accounts
- Signup also supports Apple and Google OAuth for brand and creator onboarding when environment config is present
- Email/password signup issues a single-use verification token; Apple and Google provider signup currently marks email verified during provider upsert
- Password reset issues a single-use reset token and invalidates active sessions after a successful password change
- Creator signup reserves a username before profile completion via `reserved_creator_username`
- Protected routes and handlers check both authentication state and role boundaries
