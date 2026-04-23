import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listUserReports } from "@/lib/authz";
import { FavouriteStar } from "@/components/ui/FavouriteStar";

const RECENTLY_VIEWED_COUNT = 4;

function formatAgo(d: Date | null): string {
  if (!d) return "never";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} d ago`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  async function handleSignOut(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const visibleReports = session.user.isAdmin
    ? await prisma.report.findMany({
        where: { enabled: true },
        orderBy: [{ name: "asc" }],
        include: { category: true },
      })
    : await (async () => {
        const rows = await listUserReports(userId);
        if (rows.length === 0) return [];
        const ids = rows.map((r) => r.id);
        return prisma.report.findMany({
          where: { id: { in: ids }, enabled: true },
          orderBy: [{ name: "asc" }],
          include: { category: true },
        });
      })();

  const visibleById = new Map(visibleReports.map((r) => [r.id, r]));

  const [favRows, recentRows] = await Promise.all([
    prisma.favourite.findMany({
      where: { userId },
      select: { reportId: true },
    }),
    prisma.reportView.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: 20,
      select: { reportId: true, viewedAt: true },
    }),
  ]);

  const favouriteIds = new Set(favRows.map((f) => f.reportId));
  const favouriteReports = visibleReports.filter((r) => favouriteIds.has(r.id));

  // Dedupe recently-viewed by reportId, keep first occurrence (most recent),
  // and only include reports the user can currently see.
  const seen = new Set<string>();
  const recentlyViewed: typeof visibleReports = [];
  for (const row of recentRows) {
    if (seen.has(row.reportId)) continue;
    seen.add(row.reportId);
    const report = visibleById.get(row.reportId);
    if (report) recentlyViewed.push(report);
    if (recentlyViewed.length >= RECENTLY_VIEWED_COUNT) break;
  }

  const reportsByCategory = new Map<string, typeof visibleReports>();
  for (const r of visibleReports) {
    const key = r.category?.name ?? "Uncategorised";
    if (!reportsByCategory.has(key)) reportsByCategory.set(key, []);
    reportsByCategory.get(key)!.push(r);
  }
  const categoryNames = [...reportsByCategory.keys()].sort();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-pp-nav text-pp-body/60">
            {session.user.isAdmin ? "Administrator" : "Viewer"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-pp-tight md:text-4xl">
            Welcome back,{" "}
            <span className="text-pp-orange">
              {session.user.name ?? session.user.email.split("@")[0]}
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/reports"
            className="rounded-pp-button border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-pp-navy shadow-pp-card-very-soft transition hover:bg-pp-offwhite"
          >
            All reports
          </Link>
          {session.user.isAdmin ? (
            <Link
              href="/admin/reports"
              className="rounded-pp-button border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-pp-navy shadow-pp-card-very-soft transition hover:bg-pp-offwhite"
            >
              Admin
            </Link>
          ) : null}
          <form action={handleSignOut}>
            <button
              type="submit"
              className="rounded-pp-button border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-pp-navy shadow-pp-card-very-soft transition hover:bg-pp-offwhite"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {visibleReports.length === 0 ? (
        <div className="rounded-pp-card-lg bg-white p-10 text-center shadow-pp-card-very-soft">
          <p className="text-pp-body/80">
            {session.user.isAdmin ? (
              <>
                No reports yet.{" "}
                <Link
                  href="/admin/reports/new"
                  className="font-semibold text-pp-orange hover:underline"
                >
                  Create the first one →
                </Link>
              </>
            ) : (
              <>
                You don&apos;t have any reports assigned yet. Ask an
                administrator to grant you access.
              </>
            )}
          </p>
        </div>
      ) : (
        <>
          {favouriteReports.length > 0 ? (
            <Section label="Favourites" count={favouriteReports.length}>
              <ReportGrid
                reports={favouriteReports}
                favouriteIds={favouriteIds}
              />
            </Section>
          ) : null}

          {recentlyViewed.length > 0 ? (
            <Section label="Recently viewed" count={recentlyViewed.length}>
              <ReportGrid reports={recentlyViewed} favouriteIds={favouriteIds} />
            </Section>
          ) : null}

          {categoryNames.map((cat) => (
            <Section
              key={cat}
              label={cat}
              count={reportsByCategory.get(cat)!.length}
            >
              <ReportGrid
                reports={reportsByCategory.get(cat)!}
                favouriteIds={favouriteIds}
              />
            </Section>
          ))}
        </>
      )}
    </div>
  );
}

function Section({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-base font-bold uppercase tracking-pp-nav text-pp-navy">
          {label}
        </h2>
        <span className="text-xs text-pp-body/50">
          {count} report{count === 1 ? "" : "s"}
        </span>
        <div className="ml-auto h-px flex-1 bg-black/5" />
      </div>
      {children}
    </section>
  );
}

function ReportGrid({
  reports,
  favouriteIds,
}: {
  reports: Array<{
    id: string;
    name: string;
    description: string | null;
    lastExportedAt: Date | null;
  }>;
  favouriteIds: Set<string>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((r) => (
        <div
          key={r.id}
          className="group relative rounded-pp-card bg-white p-5 shadow-pp-card-soft transition hover:-translate-y-0.5 hover:shadow-pp-card"
        >
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <FavouriteStar
              reportId={r.id}
              isFavourite={favouriteIds.has(r.id)}
            />
            <span className="inline-flex h-6 items-center rounded-pp-pill bg-pp-orange px-2.5 text-[10px] font-bold uppercase tracking-pp-nav text-white">
              PDF
            </span>
          </div>
          <Link href={`/reports/${r.id}`} className="block pr-16">
            <p className="text-base font-bold text-pp-navy group-hover:text-pp-orange">
              {r.name}
            </p>
            {r.description ? (
              <p className="mt-1.5 line-clamp-2 text-sm text-pp-body/70">
                {r.description}
              </p>
            ) : null}
            <p className="mt-4 text-xs font-medium text-pp-body/50">
              Last updated {formatAgo(r.lastExportedAt)}
            </p>
          </Link>
        </div>
      ))}
    </div>
  );
}
