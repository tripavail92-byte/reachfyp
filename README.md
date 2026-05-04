# Reachfyp

Reachfyp is a web-first creator marketplace focused on authenticity scoring, performance-based ranking, and instant hire.

## Fast Links

- [Live delivery tracker](architecture/06_live_delivery_tracker.md)
- [Architecture index](architecture/README.md)
- [Shared data model](architecture/01_shared_data_model.md)
- [Roles and permissions](architecture/02_roles_permissions.md)
- [User flows](architecture/03_user_flows.md)
- [Page maps](architecture/04_page_maps.md)
- [Module architecture](architecture/05_module_architecture.md)

## Current Status

- current phase: Phase 1 core launch
- current milestone: Week 4 marketplace shell expansion
- current live route: `/creators`
- current source of truth for progress: [architecture/06_live_delivery_tracker.md](architecture/06_live_delivery_tracker.md)

## Workspace Commands

- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`

## Railway Deploy

- Railway can deploy this repo directly from GitHub as a monorepo.
- The repo now includes [railway.json](d:/marketingsales/railway.json) so Railway builds from the workspace root and starts the Next app from `apps/web`.
- Recommended production database: Railway Postgres with `DATABASE_PROVIDER=postgres` and `DATABASE_URL` set from the Railway Postgres service.
- Do not rely on the default SQLite setup on Railway unless you intentionally attach a persistent volume and set `SQLITE_DATABASE_PATH` to that mounted path.

Minimum app service variables:

- `NEXT_PUBLIC_APP_URL=https://<your-app-domain>`
- `DATABASE_PROVIDER=postgres`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`

Optional auth and email variables:

- `POSTMARK_SERVER_TOKEN`
- `POSTMARK_FROM_EMAIL`
- `POSTMARK_MESSAGE_STREAM`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI=https://<your-app-domain>/auth/google/callback`
- `APPLE_CLIENT_ID`
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY`
- `APPLE_REDIRECT_URI=https://<your-app-domain>/auth/apple/callback`

## Rule

When a feature change lands, update the live delivery tracker in the same pass so completed work, remaining work, validation, and risks stay current.