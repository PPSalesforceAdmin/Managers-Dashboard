import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listUserReports } from "@/lib/authz";
import { FavouriteStar } from "@/components/ui/FavouriteStar";

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

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ReportsGridPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const needle = query.toLowerCase();

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

  const favRows = await prisma.favourite.findMany({
    where: { userId },
    select: { reportId: true },
  });
  const favouriteIds = new Set(favRows.map((f) => f.reportId));

  const filtered = needle
    ? visibleReports.filter((r) => {
        const hay = [r.name, r.description ?? "", r.category?.name ?? ""]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      })
    : visibleReports;

  const byCategory = new Map<string, typeof filtered>();
  for (const r of filtered) {
    const key = r.category?.name ?? "Uncategorised";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(r);
  }
  const categoryNames = [...byCategory.keys()].sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold uppercase tracking-pp-nav text-pp-body/60 hover:text-pp-orange"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-pp-tight">
            All reports
          </h1>
          <p className="mt-1 text-sm text-pp-body/70">
            {visibleReports.length} report
            {visibleReports.length === 1 ? "" : "s"} available to you.
          </p>
        </div>
      </div>

      <form
        action="/reports"
        method="get"
        className="rounded-pp-card bg-white p-3 shadow-pp-card-very-soft"
      >
        <div className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search reports by name, description, or category…"
            className="flex-1 rounded-pp-button border border-black/10 bg-white px-3 py-2 text-pp-body outline-none transition focus:border-pp-orange focus:ring-2 focus:ring-pp-orange/20"
          />
          <button
            type="submit"
            className="rounded-pp-button-lg bg-pp-orange px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            Search
          </button>
          {query ? (
            <Link
              href="/reports"
              className="rounded-pp-button border border-black/10 px-3 py-2 text-sm font-semibold text-pp-navy hover:bg-pp-offwhite"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-pp-card-lg bg-white p-10 text-center shadow-pp-card-very-soft">
          <p className="text-pp-body/80">
            {query
              ? `No reports match "${query}".`
              : session.user.isAdmin
              ? "No reports yet."
              : "You don't have any reports assigned yet."}
          </p>
        </div>
      ) : (
        categoryNames.map((cat) => (
          <section key={cat}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-base font-bold uppercase tracking-pp-nav text-pp-navy">
                {cat}
              </h2>
              <span className="text-xs text-pp-body/50">
                {byCategory.get(cat)!.length}
              </span>
              <div className="ml-auto h-px flex-1 bg-black/5" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {byCategory.get(cat)!.map((r) => (
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
                  <Link
                    href={`/reports/${r.id}`}
                    className="block pr-16"
                  >
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
          </section>
        ))
      )}
    </div>
  );
}
