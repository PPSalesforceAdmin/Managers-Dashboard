import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/server/session";
import {
  updateReport,
  deleteReport,
  exportReportNow,
} from "@/lib/reports-actions";
import { ReportFormFields } from "@/components/ui/ReportFormFields";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [report, categories, lastRuns] = await Promise.all([
    prisma.report.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.exportRun.findMany({
      where: { reportId: id },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
  ]);

  if (!report) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/reports"
            className="text-sm text-slate-500 hover:underline"
          >
            ← Reports
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-pp-navy">
            {report.name}
          </h1>
        </div>
        <div className="flex gap-2">
          {report.latestExportPath ? (
            <Link
              href={`/reports/${report.id}`}
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            >
              View latest PDF →
            </Link>
          ) : null}
          <form action={exportReportNow}>
            <input type="hidden" name="id" value={report.id} />
            <button
              type="submit"
              className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Export now
            </button>
          </form>
        </div>
      </div>

      <form
        action={updateReport}
        className="rounded border border-slate-200 bg-white p-5"
      >
        <input type="hidden" name="id" value={report.id} />
        <ReportFormFields categories={categories} report={report} />
        <div className="mt-6 flex justify-between">
          <form action={deleteReport}>
            <input type="hidden" name="id" value={report.id} />
            <button
              type="submit"
              className="rounded border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete report
            </button>
          </form>
          <button
            type="submit"
            className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Save changes
          </button>
        </div>
      </form>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Recent export runs
        </h2>
        <div className="overflow-hidden rounded border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Started</th>
                <th className="px-4 py-2">Completed</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {lastRuns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No runs yet.
                  </td>
                </tr>
              ) : (
                lastRuns.map((run) => (
                  <tr key={run.id} className="border-t border-slate-200">
                    <td className="px-4 py-2 text-slate-500">
                      {run.startedAt.toISOString().replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {run.completedAt
                        ? run.completedAt.toISOString().replace("T", " ").slice(0, 19)
                        : "—"}
                    </td>
                    <td className="px-4 py-2">{run.status}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {run.fileSizeBytes
                        ? `${(run.fileSizeBytes / 1024).toFixed(0)} KB`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-red-600 text-xs">
                      {run.errorMessage ?? ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
