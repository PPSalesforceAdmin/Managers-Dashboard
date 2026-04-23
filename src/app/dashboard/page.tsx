import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listUserReports } from "@/lib/authz";

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
        const rows = await listUserReports(session.user.id);
        if (rows.length === 0) return [];
        const ids = rows.map((r) => r.id);
        return prisma.report.findMany({
          where: { id: { in: ids }, enabled: true },
          orderBy: [{ name: "asc" }],
          include: { category: true },
        });
      })();

  const reportsByCategory = new Map<
    string,
    typeof visibleReports
  >();
  for (const r of visibleReports) {
    const key = r.category?.name ?? "Uncategorised";
    if (!reportsByCategory.has(key)) reportsByCategory.set(key, []);
    reportsByCategory.get(key)!.push(r);
  }
  const categoryNames = [...reportsByCategory.keys()].sort();

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-pp-navy">
            Welcome, {session.user.email}
          </h1>
          <p className="mt-1 text-slate-600">
            {session.user.isAdmin ? "Administrator" : "Viewer"}
          </p>
        </div>
        <div className="flex gap-2">
          {session.user.isAdmin ? (
            <Link
              href="/admin/reports"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              Admin
            </Link>
          ) : null}
          <form action={handleSignOut}>
            <button
              type="submit"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {visibleReports.length === 0 ? (
        <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          {session.user.isAdmin ? (
            <>
              No reports yet.{" "}
              <Link
                href="/admin/reports/new"
                className="text-pp-orange underline"
              >
                Create the first one →
              </Link>
            </>
          ) : (
            <>You don't have any reports assigned yet. Ask an administrator to grant you access.</>
          )}
        </div>
      ) : (
        categoryNames.map((cat) => (
          <section key={cat}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {cat}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reportsByCategory.get(cat)!.map((r) => (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="block rounded border border-slate-200 bg-white p-4 hover:border-pp-orange hover:shadow-sm"
                >
                  <p className="font-medium text-pp-navy">{r.name}</p>
                  {r.description ? (
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      {r.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    Last updated {formatAgo(r.lastExportedAt)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
