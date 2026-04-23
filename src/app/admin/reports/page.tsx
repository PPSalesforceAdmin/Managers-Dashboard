import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/server/session";

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

export default async function ReportsAdminPage() {
  await requireAdmin();
  const reports = await prisma.report.findMany({
    orderBy: [{ name: "asc" }],
    include: { category: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-pp-navy">Reports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Each report maps to one Tableau view. The worker exports them on
            their individual schedule; admins can trigger an export manually.
          </p>
        </div>
        <Link
          href="/admin/reports/new"
          className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          + New report
        </Link>
      </div>

      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Last export</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Enabled</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No reports yet. <Link className="text-pp-orange underline" href="/admin/reports/new">Create the first one →</Link>
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {r.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {formatAgo(r.lastExportedAt)}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.lastExportStatus} />
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {r.enabled ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/reports/${r.id}`}
                      className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "PENDING" | "SUCCESS" | "FAILED" }) {
  const styles: Record<typeof status, string> = {
    PENDING: "bg-slate-100 text-slate-600",
    SUCCESS: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}
