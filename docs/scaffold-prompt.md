# Claude Code Scaffold Prompt — Tableau Static Export Portal

> Paste this prompt into Claude Code as your first message. Also place `tableau-portal-technical-plan.md` at `/docs/technical-plan.md` in the repo before starting — Claude Code will reference it throughout the build.

---

## Task

Build the initial scaffold of an internal Next.js web portal that displays pre-exported PDF versions of Tableau Cloud reports. Full architecture, data model, and feature list is in `/docs/technical-plan.md`. Read it first before writing any code.

This scaffold prompt covers only the **foundation** — a runnable skeleton with auth, DB, storage, the Tableau REST client, and a bootstrap script. Feature work (admin UI, reports grid, PDF viewer, announcements, etc.) will be subsequent prompts.

## Constraints to follow

- TypeScript everywhere, no `any` without a comment explaining why
- Next.js 15 with App Router
- Server Components by default; Client Components only when needed
- Auth.js v5 (`@auth/core`, not deprecated NextAuth v4)
- Prisma for all DB access
- Tailwind for styling, no other UI library except `react-pdf` and `react-zoom-pan-pinch` (later)
- No hard-delete of users — `status = DISABLED` only
- Every report data API route re-checks authorisation server-side
- PAT never logged or returned in API responses
- Colours: Progressive Property orange `#F26522`, navy `#1a2744`

## Repo structure to create

```
/
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example
├── .gitignore
├── README.md
├── railway.json                      (two-service config)
├── /docs
│   ├── technical-plan.md             (already placed here by user)
│   └── runbook.md                    (create — PAT rotation, bootstrap steps, deployment notes)
├── /prisma
│   ├── schema.prisma
│   └── seed.ts                       (minimal — creates default roles + 1 category)
├── /scripts
│   └── bootstrap-admin.ts            (CLI: prompts for email + password, creates first admin)
├── /src
│   ├── /app
│   │   ├── layout.tsx                (root layout, session provider, PP branding)
│   │   ├── page.tsx                  (redirects to /dashboard if auth else /login)
│   │   ├── /login
│   │   │   └── page.tsx              (email + password + TOTP form, stub for now)
│   │   ├── /change-password
│   │   │   └── page.tsx              (forced redirect target when forcePasswordChange = true)
│   │   ├── /dashboard
│   │   │   └── page.tsx              (stub — just shows "Welcome, {email}" for now)
│   │   └── /api
│   │       └── /auth/[...nextauth]
│   │           └── route.ts          (Auth.js handler)
│   ├── /components
│   │   └── /ui                       (small reusable primitives only)
│   ├── /lib
│   │   ├── auth.ts                   (Auth.js config, credentials provider, 2h session)
│   │   ├── db.ts                     (Prisma client singleton)
│   │   ├── authz.ts                  (canUserViewReport, isAdmin helpers)
│   │   ├── storage.ts                (file storage wrapper — reads/writes /data/reports)
│   │   └── /tableau
│   │       ├── client.ts             (REST API client — signin/signout/export)
│   │       └── types.ts              (response types)
│   ├── /server
│   │   └── audit.ts                  (logAuditEvent helper)
│   └── middleware.ts                 (Auth.js middleware — protects all routes except /login, /api/auth/*)
└── /worker
    ├── index.ts                      (entrypoint — npm run worker:tick)
    ├── dispatcher.ts                 (picks reports whose refreshCron is due)
    └── exporter.ts                   (per-report export logic)
```

## Dependencies

```bash
# runtime
npm install next@latest react@latest react-dom@latest
npm install @prisma/client
npm install @auth/core @auth/prisma-adapter
npm install bcryptjs otplib
npm install zod
npm install sharp

# dev
npm install -D typescript @types/node @types/react @types/react-dom @types/bcryptjs
npm install -D prisma
npm install -D tailwindcss postcss autoprefixer
npm install -D tsx                    # for running bootstrap + worker scripts
npm install -D eslint eslint-config-next
```

Do NOT install `react-pdf` or `react-zoom-pan-pinch` yet — those come with feature work in later prompts. No email library (Resend/Nodemailer) will be installed at any point; password flows are fully in-app.

## package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:seed": "tsx prisma/seed.ts",
    "bootstrap:admin": "tsx scripts/bootstrap-admin.ts",
    "worker:tick": "tsx worker/index.ts"
  }
}
```

## .env.example

```
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Auth.js
AUTH_SECRET=""                         # generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"       # production: https://your-domain

# Storage
STORAGE_PATH="./data/reports"          # local dev; production: /data/reports

# Tableau Cloud REST API
TABLEAU_SITE_URL="https://prod-uk-a.online.tableau.com"     # confirm exact pod URL
TABLEAU_SITE_CONTENT_URL=""            # the site content URL (from Tableau URL after /site/)
TABLEAU_PAT_NAME=""                    # name given to PAT in Tableau settings
TABLEAU_PAT_SECRET=""                  # secret string generated alongside the name
TABLEAU_API_VERSION="3.22"             # adjust to match Tableau Cloud's current version
```

## Prisma schema

Copy the full Prisma schema from `/docs/technical-plan.md` section 4. Do not modify it. Ensure all relations compile. Run `prisma migrate dev --name init` after creating the schema.

## Critical file specs

### `/src/lib/auth.ts`
- Auth.js v5 configuration
- Credentials provider only (no OAuth)
- Session strategy: `jwt`
- Session maxAge: 7200 seconds (2 hours)
- Session updateAge: 300 seconds (rolling refresh)
- Credentials authorize callback:
  - Validate email + password with bcrypt
  - If user has `mfaEnabled`, validate 6-digit TOTP code from form
  - Check `status = ACTIVE`
  - Return user with `id`, `email`, `isAdmin`
- JWT + session callbacks expose `userId` and `isAdmin`
- Events: `signIn` → update `lastLoginAt`, log to AuditLog
- Use `@auth/prisma-adapter` for any persisted records (sessions kept in JWT for now, but adapter configured for future)

### `/src/middleware.ts`
- Runs on all paths except `/login`, `/api/auth/*`, `/_next/*`, static assets
- Redirects unauthenticated requests to `/login?callbackUrl=...`
- If user is authenticated AND `forcePasswordChange = true` AND current path is not `/change-password` or `/api/account/password` → redirect to `/change-password`
- Admin routes (`/admin/*`, `/api/admin/*`) additionally require `isAdmin = true` in token, else 403

### `/src/lib/authz.ts`
Two helpers:
```ts
canUserViewReport(userId: string, reportId: string): Promise<boolean>
listUserReports(userId: string): Promise<Report[]>
```
Implementation uses the authorisation SQL from technical plan section 6. Single query with UNION of direct grants and role grants.

### `/src/lib/tableau/client.ts`
- Class `TableauClient` with methods:
  - `signIn()` → stores auth token + site LUID
  - `signOut()`
  - `exportViewPdf(viewLuid, { orientation, filterParams })` → returns `Buffer`
  - `exportViewPng(viewLuid, { filterParams })` → returns `Buffer`
- Uses fetch; no third-party HTTP library
- All endpoints use `TABLEAU_API_VERSION` from env
- Never log the PAT secret or auth token
- Throws typed errors (`TableauAuthError`, `TableauExportError`, `TableauNotFoundError`)

### `/src/lib/storage.ts`
- Wraps filesystem operations on `STORAGE_PATH`
- Methods:
  - `writeReportFile(reportId, 'latest.pdf', buffer)` — writes to `.tmp` then atomic rename
  - `writeReportThumbnail(reportId, buffer)`
  - `readReportFile(reportId, filename)` → returns stream for API route
  - `ensureReportDir(reportId)`
- Path traversal protection: reject any `reportId` that's not a valid cuid

### `/worker/dispatcher.ts`
- Queries all Reports where `enabled = true`
- For each, parses `refreshCron` and determines if the next scheduled run is ≤ now AND lastExportedAt is before that scheduled run
- Use `cron-parser` (add to deps) to compute the last scheduled run before now
- Returns list of due reports

### `/worker/index.ts`
Entry point for `npm run worker:tick`. Flow:
1. Connect to DB
2. Call dispatcher to get due reports
3. If none, log "no reports due" and exit 0
4. Sign in to Tableau (single session)
5. For each due report: call `exporter.exportReport(report, tableauClient)` sequentially
6. Sign out of Tableau
7. Disconnect from DB
8. Exit 0 on success, exit 1 on any unhandled error

### `/scripts/bootstrap-admin.ts`
Interactive CLI:
1. Prompts for email and password (password hidden as typed)
2. Requires password ≥ 12 chars
3. Refuses if any admin user already exists (prints: "Admin account already exists. Use the app to create additional admins.")
4. Creates user with `isAdmin: true`, `status: ACTIVE`, `mfaEnabled: false`
5. Prints success with the email

## Initial milestones

Build in this order and verify each before moving on:

1. **Project boots.** `npm run dev` serves the Next.js app; TypeScript and Tailwind compile with no errors.
2. **Database connected.** `prisma migrate dev --name init` runs clean and creates all tables from the technical plan schema.
3. **Seed runs.** `npm run prisma:seed` creates default roles (`Admin`, `Viewer`) and one example category (`General`).
4. **Bootstrap script works.** `npm run bootstrap:admin` creates the first admin. Running it a second time refuses with the expected message.
5. **Login works.** At `/login`, entering the bootstrapped admin credentials lands the user at `/dashboard` which shows "Welcome, {email}". Wrong credentials stay on `/login` with an error.
6. **Middleware protects routes.** Hitting `/dashboard` unauthenticated redirects to `/login`. Hitting `/admin/users` as a non-admin returns 403.
7. **Tableau client connects.** A simple `/api/admin/tableau/ping` route (admin-only, not in final product) calls `signIn` then `signOut` against Tableau Cloud and returns `{ ok: true }`. Confirms PAT + site URL + content URL are all correct before touching report exports.
8. **Worker dispatcher runs empty.** `npm run worker:tick` with no reports in the DB logs "no reports due" and exits 0.
9. **README updated.** Setup steps, env var reference, how to run bootstrap, how to run worker locally.

Stop here. Next prompt will cover: seeding a test report, first successful export, storage read/write, PDF streaming API, and the admin reports CRUD.

## Deployment note (Railway)

Defer Railway config until the scaffold runs locally. When ready, `railway.json` should declare:
- Service `web`: build `npm run build && npx prisma migrate deploy`, start `npm run start`
- Service `worker`: cron `*/5 * * * *`, start `npm run worker:tick`
- Volume `/data` mounted on both services
- Shared `DATABASE_URL` from Railway Postgres
- Distinct env var sets per service (worker does not need `AUTH_SECRET`; web does not need `TABLEAU_PAT_*`)

---

Read `/docs/technical-plan.md`, then proceed through the milestones.
