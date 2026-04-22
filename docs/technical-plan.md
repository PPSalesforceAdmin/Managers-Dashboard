# Tableau Static Export Portal — Technical Plan

## 1. Overview

A web portal displaying pre-exported PDF versions of Tableau Cloud reports. Users log in, see only the reports they have permission to view, and view/download the latest exports on desktop or mobile. The portal never talks to Tableau from the viewer's browser — it only serves static files.

A scheduled export worker pulls fresh exports from Tableau Cloud on cron using the Tableau REST API, authenticated with a Personal Access Token (PAT) tied to the licence owner's account.

### Why this approach
- No per-user Tableau licences needed — only the PAT owner interacts with Tableau
- Stays cleanly within Tableau ToS
- Mobile-friendly by default (PDFs/images are responsive)
- Simpler security model (no JWT minting, no Tableau session in browser)

### Known trade-offs
- No interactivity (no clickable filters, no drilldown, no tooltips)
- Data freshness limited to export cadence
- Filter variations must be pre-generated as separate report entries
- The PAT is a powerful credential — must be protected carefully

## 2. Architecture

```
┌──────────────────────┐       ┌─────────────────┐
│  Railway Cron Job    │       │   Tableau Cloud │
│  (Export Worker)     │──────▶│   REST API      │
│  Runs hourly         │◀──────│                 │
└──────────┬───────────┘       └─────────────────┘
           │ writes PDFs + thumbnails
           ▼
┌──────────────────────┐
│  Railway Volume      │
│  (mounted /data)     │
└──────────┬───────────┘
           │ reads
           ▼
┌──────────────────────┐       ┌─────────────────┐
│  Next.js Portal      │──────▶│  Postgres +     │
│  (Railway)           │◀──────│  Prisma         │
│                      │       │  (users, roles, │
│  - Auth.js + TOTP    │       │   reports, etc.)│
│  - PDF viewer        │       └─────────────────┘
│  - Admin UI          │
└──────────┬───────────┘
           │ HTTPS
           ▼
   Browsers (desktop + mobile)
```

## 3. Technology stack

- **Frontend + backend**: Next.js 15 (App Router), TypeScript, Tailwind
- **Auth**: Auth.js v5 with credentials provider
- **Database**: Postgres (Railway-managed), Prisma ORM
- **Object storage**: Railway volume for MVP (~150MB total for 30 reports)
- **Export worker**: Node.js script on Railway cron (same monorepo, separate entrypoint)
- **PDF viewer**: `react-pdf` (PDF.js wrapper) for consistent cross-device rendering
- **Thumbnails**: `sharp` + `pdf-to-img` for first-page PNG previews
- **MFA**: TOTP via `otplib` (admins only)
- **Deployment**: Railway (two services from one repo: `web` + `export-worker`)

## 4. Data model (Prisma)

```prisma
model User {
  id                  String     @id @default(cuid())
  email               String     @unique
  passwordHash        String
  mfaSecret           String?
  mfaEnabled          Boolean    @default(false)
  forcePasswordChange Boolean    @default(false)
  status              UserStatus @default(ACTIVE)
  isAdmin             Boolean    @default(false)
  createdAt           DateTime   @default(now())
  lastLoginAt         DateTime?

  roles           UserRole[]
  reportGrants    UserReport[]
  favourites      Favourite[]
  reportViews     ReportView[]
  auditLogs       AuditLog[]
}

// Users are NEVER hard-deleted. Deactivation sets status = DISABLED.
// This preserves audit log history and report-view history tied to the user.

enum UserStatus { ACTIVE DISABLED }

model Role {
  id              String       @id @default(cuid())
  name            String       @unique
  description     String?
  users           UserRole[]
  reports         RoleReport[]
}

model UserRole {
  userId  String
  roleId  String
  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  role    Role  @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@id([userId, roleId])
}

model Category {
  id           String   @id @default(cuid())
  name         String   @unique
  description  String?
  sortOrder    Int      @default(0)
  reports      Report[]
  createdAt    DateTime @default(now())
}

model Report {
  id                  String       @id @default(cuid())
  name                String
  description         String?
  categoryId          String?
  category            Category?    @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  tableauViewId       String       // REST API view LUID
  tableauContentUrl   String       // human-readable path
  filterParams        Json?        // e.g. {"vf_Region": "North"}
  exportFormat        ExportFormat @default(PDF)
  orientation         Orientation  @default(LANDSCAPE)
  refreshCron         String       @default("0 * * * *")  // per-report schedule
  latestExportPath    String?
  latestThumbnailPath String?
  lastExportedAt      DateTime?
  lastExportStatus    ExportStatus @default(PENDING)
  enabled             Boolean      @default(true)
  createdAt           DateTime     @default(now())

  roles         RoleReport[]
  userGrants    UserReport[]
  exportHistory ExportRun[]
  favourites    Favourite[]
  views         ReportView[]
}

model Favourite {
  userId    String
  reportId  String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  report    Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  @@id([userId, reportId])
}

model ReportView {
  id         String   @id @default(cuid())
  userId     String
  reportId   String
  viewedAt   DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  report     Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  @@index([userId, viewedAt])
}

model Announcement {
  id          String    @id @default(cuid())
  title       String
  body        String
  active      Boolean   @default(true)
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())
  createdById String?
}

enum ExportFormat { PDF PNG }
enum Orientation  { PORTRAIT LANDSCAPE }
enum ExportStatus { PENDING SUCCESS FAILED }

model RoleReport {
  roleId    String
  reportId  String
  role      Role    @relation(fields: [roleId], references: [id], onDelete: Cascade)
  report    Report  @relation(fields: [reportId], references: [id], onDelete: Cascade)
  @@id([roleId, reportId])
}

model UserReport {
  userId    String
  reportId  String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  report    Report  @relation(fields: [reportId], references: [id], onDelete: Cascade)
  @@id([userId, reportId])
}

model ExportRun {
  id            String       @id @default(cuid())
  reportId      String
  startedAt     DateTime     @default(now())
  completedAt   DateTime?
  status        ExportStatus
  errorMessage  String?
  filePath      String?
  fileSizeBytes Int?
  report        Report       @relation(fields: [reportId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String   // "login", "view_report", "download_report", "admin_user_create", etc.
  targetId   String?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  user       User?    @relation(fields: [userId], references: [id])
}
```

## 5. Export worker

Runs on Railway cron. The cron itself fires every 5 minutes as a dispatcher; each run checks which reports are *due* for export based on their individual `refreshCron` field and exports only those. This gives per-report flexibility without running multiple Railway services.

Default `refreshCron` for new reports is hourly (`0 * * * *`), configurable per report in the admin UI (e.g. daily `0 6 * * *`, every 15 min `*/15 * * * *`).

### Flow per run
```
1. Sign in to Tableau Cloud REST API using PAT
   POST /api/3.x/auth/signin
   body: { credentials: { personalAccessTokenName, personalAccessTokenSecret,
                          site: { contentUrl } } }
   → capture token + site LUID

2. For each Report where enabled = true AND refreshCron is due
   (i.e. time since lastExportedAt exceeds the cron interval):
   a. Create ExportRun with status = PENDING
   b. Build export URL:
      /api/3.x/sites/{siteLuid}/views/{viewLuid}/pdf
        ?type=a4&orientation=landscape&{filterParams}
      (or /image for PNG)
   c. Stream response to temp file
   d. Generate thumbnail (first page → 400px PNG) with pdf-to-img + sharp
   e. Move both files to:
      /data/reports/{reportId}/latest.pdf
      /data/reports/{reportId}/latest-thumb.png
      (atomic replace — write to .tmp, then rename)
   f. Update Report: latestExportPath, latestThumbnailPath,
      lastExportedAt, lastExportStatus = SUCCESS
   g. Update ExportRun: completedAt, status = SUCCESS, filePath, fileSizeBytes

3. On error for a report: log error, mark ExportRun FAILED,
   leave previous latest export in place (never delete on failure)

4. Sign out: POST /api/3.x/auth/signout
```

### Concurrency
Process reports sequentially. Tableau's export endpoint is server-heavy; parallelising risks 429s and provides no real benefit at 30-report scale.

### PAT management
- Store as `TABLEAU_PAT_NAME` and `TABLEAU_PAT_SECRET` env vars
- Rotate every 180 days minimum (calendar reminder)
- Document rotation steps in `/docs/runbook.md`
- The PAT owner must be a Tableau user with permission to view every report being exported

## 6. Web portal routes

```
/login                    — Email + password + TOTP (admins only)
/change-password          — Forced page if forcePasswordChange = true; also reachable from account menu

/                         — Redirects to /dashboard
/dashboard                — Landing page (welcome, active announcements, recently viewed, favourites)
/reports                  — Full report grid, grouped by category, with search box
/reports/[id]             — PDF viewer with zoom, download, "last updated X ago", favourite toggle
/favourites               — User's favourite reports
/account                  — Change own password, enrol/remove own MFA (admins only can enrol)

/admin                    — Admin-only layout
/admin/users              — User CRUD, role assignment, reset password (generates temp), MFA reset, disable/re-enable
/admin/roles              — Role CRUD, report assignment
/admin/categories         — Category CRUD, drag-to-reorder
/admin/reports            — Report CRUD, category assignment, per-report schedule, manual export
/admin/announcements      — Announcement CRUD (title, body, expiry)
/admin/audit              — Audit log viewer (searchable, filterable by user/action/date)

/api/auth/*               — Auth.js endpoints
/api/account/password     — POST to change own password (requires current password)
/api/reports              — GET list for current user (grouped by category, search param)
/api/reports/[id]/file    — Stream PDF (authz-checked, logs ReportView)
/api/favourites           — POST / DELETE to toggle
/api/announcements/active — GET currently-active announcements
/api/admin/users/[id]/reset-password — POST returns { tempPassword }, sets forcePasswordChange = true
/api/admin/*              — Admin CRUD (authz-checked)
/api/cron/export          — Dispatcher endpoint (Railway cron hits this every 5 min)
```

### Authorisation check (every report access)
```sql
SELECT r.* FROM "Report" r
WHERE r.id = $reportId
  AND r.enabled = true
  AND (
    EXISTS (SELECT 1 FROM "UserReport" ur
            WHERE ur."userId" = $userId AND ur."reportId" = r.id)
    OR EXISTS (SELECT 1 FROM "RoleReport" rr
               JOIN "UserRole" ur ON ur."roleId" = rr."roleId"
               WHERE ur."userId" = $userId AND rr."reportId" = r.id)
  )
```

### Mobile UX
- Landing page (`/dashboard`) shows: welcome line, any active announcements, 4 most recently viewed reports, favourites strip
- `/reports` page: category sections with search box pinned to top
- Responsive grid: 1 col mobile, 2 tablet, 3-4 desktop
- PDF viewer: `react-pdf` + `react-zoom-pan-pinch` for pinch-zoom
- Favourite (star) toggle on every report tile and in the viewer
- Download button always visible (native PDF viewer fallback)
- No horizontal scroll anywhere
- Touch-target sizes ≥ 44px

## 7. Security

### Required
- HTTPS only, HSTS header (Railway provides TLS)
- Session cookies: `httpOnly`, `secure`, `sameSite=lax`
- Session lifetime: 2 hours rolling (resets on activity, hard logout after 2h idle)
- MFA mandatory for admin users, optional (but recommended) for viewers
- Rate limit `/api/auth/*` to 5 attempts / 15 min / IP
- Rate limit `/api/reports/[id]/file` to prevent scraping
- CSP header restricting external sources
- Never expose `tableauViewId` or `tableauContentUrl` client-side outside admin UI

### PAT protection
- Stored only in Railway env vars
- Never logged, never returned in any API response
- Export worker is the only code path that reads it

### Server-side authorisation
- Every API route returning report data re-checks authorisation from DB
- No reliance on UI hiding for access control
- Admin routes protected by middleware checking `user.isAdmin`

### Audit log entries
- Login success/failure
- Password change, MFA enrol/disable
- Report view + report download (with reportId)
- All admin actions (user/role/report CRUD, manual export trigger)

## 8. Deployment (Railway)

**Two services, one repo.**

### Service: `web`
- Build: `npm run build`
- Start: `npm run start`
- Env: `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `STORAGE_PATH`, `AUTH_URL`
- Public HTTPS domain
- Volume mounted at `/data`

### Service: `export-worker`
- Cron schedule: `0 * * * *`
- Start: `npm run export`
- Env: `DATABASE_URL`, `TABLEAU_PAT_NAME`, `TABLEAU_PAT_SECRET`, `TABLEAU_SITE_URL`, `TABLEAU_SITE_CONTENT_URL`, `STORAGE_PATH`
- Not publicly exposed
- Volume mounted at `/data` (same volume as `web`)

### Railway Postgres
- Connected to both services via `DATABASE_URL`

## 9. MVP scope vs v2

### MVP (ship first)
- Email + password login
- TOTP MFA mandatory for admins, not available to viewers
- In-app password change (user changes own via `/account`)
- Admin-initiated password reset (generates temp password, shown once to admin, user forced to change on next login)
- Forced password change on first login for all new users
- 2-hour rolling session timeout
- Roles → reports mapping
- Direct user → report grants (overrides)
- Landing page with welcome, active announcements, recently viewed, favourites
- Full reports page grouped by category with search
- Favourites (star toggle, persistent per user)
- Categories (admin-managed, drag-to-reorder)
- PDF viewer (react-pdf) with zoom + download
- Per-report refresh schedules (configurable in admin UI)
- 5-minute cron dispatcher that runs due reports
- Admin UI for users, roles, categories, reports, announcements
- Audit log + admin-facing audit viewer
- Soft-delete only for users (status = DISABLED preserves history)
- Railway volume storage

### v2 (after it's running in production)
- Per-report "refresh now" button (admin)
- Email notifications when new exports land
- "New since last view" badge on report tiles
- Multi-page dashboard support (pack of views)
- Storage migration to S3/R2 if volume grows large
- On-demand filter selection (triggers targeted re-export) — partial break from static model
- Dark mode

## 10. Open decisions — confirm before Claude Code build starts

1. **Default export frequency.** Per-report schedules are in. Default for new reports is hourly. Confirm or set a different default (e.g. daily at 6am).
2. **Export format.** Default PDF (vector, zoomable, downloadable) with PNG thumbnails. Confirm or switch to PNG-only.
3. **Storage retention.** Default: keep only latest export per report. Confirm or specify how many versions to retain.
4. **Filter model.** For same dashboard with different filters per role: create two `Report` rows pointing at same `tableauViewId` with different `filterParams`. Confirm acceptable.
5. **Recently viewed count.** How many reports to show in the "recently viewed" strip on the landing page? Default 4.
6. **Temp password format.** When admin resets a user's password, what format for the temp password? Default: 12-char random with mixed case + digits + symbols, excluding ambiguous chars (0/O, 1/l/I).

Once these are answered, next output is a scaffold prompt for Claude Code: repo structure, `package.json` scripts, Prisma schema seeded, env var template, and Railway config.
