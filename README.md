# Managers Dashboard

Internal portal for Progressive Property that displays pre-exported PDF versions
of Tableau Cloud reports. A scheduled worker pulls fresh exports from Tableau
Cloud via the REST API (authenticated with a PAT); the Next.js app serves those
exports to authenticated users, scoped by role and direct-grant permissions.

- **Stack**: Next.js 15 (App Router) + TypeScript + Tailwind + Auth.js v5 + Prisma + Postgres
- **Auth**: email + password + TOTP (admins mandatory)
- **Deployment**: Railway — `web` service (Next.js) + `worker` service (cron-scheduled exporter), sharing Postgres + `/data` volume

Full specs live in [`docs/technical-plan.md`](docs/technical-plan.md). This
scaffold covers milestones 1–9 from [`docs/scaffold-prompt.md`](docs/scaffold-prompt.md);
feature work (reports grid, PDF viewer, admin CRUD, etc.) comes in subsequent
prompts.

## Prerequisites

- Node.js 20+ (tested with 24.x)
- Postgres 14+ (local or Railway)
- A Tableau Cloud PAT with view access to all reports you'll surface

## Local setup

```bash
# 1. Install deps
npm install

# 2. Copy env template and fill in values
cp .env.example .env
# edit .env — set DATABASE_URL, AUTH_SECRET (openssl rand -base64 32), TABLEAU_* vars

# 3. Create DB schema
npx prisma migrate dev --name init

# 4. Seed default roles + category
npm run prisma:seed

# 5. Create first admin (interactive — prompts for email + password)
npm run bootstrap:admin

# 6. Start dev server
npm run dev
```

Visit `http://localhost:3000` → you'll be redirected to `/login`. Sign in with
the admin you just created. Wrong credentials stay on `/login` with an error.

### Run the worker locally

```bash
npm run worker:tick
```

With no reports in the DB, it prints `no reports due` and exits 0.

### Test the Tableau connection

Once signed in as an admin, hit `GET /api/admin/tableau/ping`:

```bash
curl -b cookies.txt http://localhost:3000/api/admin/tableau/ping
# → {"ok":true}  on success
# → {"ok":false,"error":"..."} on failure (check your PAT + site URL)
```

## Environment variables

See [`.env.example`](.env.example). Grouped by service:

| Variable | `web` | `worker` | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✓ | ✓ | Railway Postgres connection string |
| `AUTH_SECRET` | ✓ |   | `openssl rand -base64 32` |
| `AUTH_URL` | ✓ |   | Public URL of the web service |
| `AUTH_TRUST_HOST` | ✓ |   | Set `"true"` on Railway |
| `STORAGE_PATH` | ✓ | ✓ | `/data/reports` in prod; `./data/reports` locally |
| `TABLEAU_SITE_URL` |   | ✓ | e.g. `https://prod-uk-a.online.tableau.com` |
| `TABLEAU_SITE_CONTENT_URL` |   | ✓ | Site content URL from Tableau |
| `TABLEAU_PAT_NAME` |   | ✓ | Never set on `web` |
| `TABLEAU_PAT_SECRET` |   | ✓ | Never set on `web` |
| `TABLEAU_API_VERSION` |   | ✓ | Default `3.22` |

The ping route (`/api/admin/tableau/ping`) also needs the `TABLEAU_*` vars on
`web` — remove it once the worker is proven end-to-end.

## Railway setup (one-time, browser)

1. **Create project** from the GitHub repo (authorise the Railway GitHub app).
2. **Add Postgres** plugin — Railway injects `DATABASE_URL` automatically.
3. **Create Volume** — mount at `/data` on both services.
4. **Create service `web`**:
   - Start command: `npx prisma migrate deploy && npm run start`
   - Env: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST=true`, `STORAGE_PATH=/data/reports`
5. **Create service `worker`**:
   - Start command: `npm run worker:tick`
   - Cron schedule: `*/5 * * * *`
   - Env: `DATABASE_URL`, `STORAGE_PATH=/data/reports`, all `TABLEAU_*` vars
   - No public networking
6. Push to `main` → both services build and deploy.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run prisma:migrate` | Create + apply dev migration |
| `npm run prisma:migrate:deploy` | Apply pending migrations (prod) |
| `npm run prisma:seed` | Seed default roles + category |
| `npm run prisma:studio` | Prisma Studio DB browser |
| `npm run bootstrap:admin` | Create first admin (refuses if one exists) |
| `npm run worker:tick` | Run one export dispatcher tick |

## Project structure

```
src/
├── app/                  Next.js App Router pages + API routes
├── lib/                  Auth, DB, authz, storage, Tableau client
├── server/               Server-only helpers (audit)
└── middleware.ts         Auth + admin route guards
prisma/                   Schema + seed
scripts/bootstrap-admin.ts
worker/                   Cron dispatcher + per-report exporter
docs/                     Technical plan, scaffold prompt, runbook
```

## Security notes

- Sessions: 2h rolling, JWT strategy, `httpOnly/secure/sameSite=lax` cookies
- Every report data route re-checks authorisation server-side
- PAT stored only in env vars, never logged or returned
- No hard-delete of users — disable via `status = DISABLED`

## Status

- [x] Milestone 1 — project boots
- [x] Milestone 2 — DB schema compiles
- [x] Milestone 3 — seed runs
- [x] Milestone 4 — bootstrap script
- [x] Milestone 5 — login → dashboard
- [x] Milestone 6 — middleware guards routes
- [x] Milestone 7 — Tableau ping route
- [x] Milestone 8 — worker dispatcher runs empty
- [x] Milestone 9 — README

Feature work (admin UI, reports grid, PDF viewer, announcements) comes in subsequent prompts.
