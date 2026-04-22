# Runbook — Managers Dashboard

Operational notes for running and maintaining the portal.

## PAT rotation (every ≤180 days)

The Tableau Personal Access Token is the only credential the export worker uses
to talk to Tableau Cloud. It must be rotated regularly.

1. In Tableau Cloud, go to your user account → **Settings → Personal Access Tokens**.
2. Create a new PAT with a descriptive name (e.g. `managers-dashboard-2026-10`).
3. Copy the token secret immediately — it is shown only once.
4. Update the Railway `worker` service env vars:
   - `TABLEAU_PAT_NAME` → new name
   - `TABLEAU_PAT_SECRET` → new secret
5. Redeploy the `worker` service.
6. Trigger a manual export via the admin UI (or wait for the next cron tick) and
   confirm the next `ExportRun` row is `SUCCESS`.
7. Revoke the old PAT in Tableau Cloud.

The PAT owner must have permission to view every report being exported.

## First-time bootstrap

1. Provision the Railway Postgres database and volume; set env vars on both services.
2. `npm run prisma:migrate:deploy` (runs automatically on `web` deploy).
3. `npm run prisma:seed` to create default roles and the `General` category.
4. Run `npm run bootstrap:admin` in a Railway shell (or locally against prod DB)
   to create the first admin account.
5. Log in at `/login` with the admin credentials.

## Worker troubleshooting

| Symptom | First check |
|---|---|
| Report stays at `PENDING` status | Worker service logs — did cron fire? |
| Export fails repeatedly | Admin UI → Audit / ExportRun error message |
| Sign-in 401 from Tableau | PAT name/secret correct? PAT still valid? |
| 404 on view | View LUID correct? PAT owner has access? |

## Deployment notes

- `web` and `worker` share the same Railway Postgres and `/data` volume.
- The worker service should have **no public networking** — it only runs on the cron schedule.
- Never set `TABLEAU_PAT_*` env vars on the `web` service; they are only needed by the worker.
- Never set `AUTH_SECRET` on the `worker` service.
