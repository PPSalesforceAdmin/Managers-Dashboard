import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/server/session";
import { canUserViewReport } from "@/lib/authz";
import { exportReportNow } from "@/lib/reports-actions";
import { PdfViewer } from "@/components/ui/PdfViewer";

function formatAgo(d: Date | null): string {
  if (!d) return "never exported";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} d ago`;
}

export default async function ReportViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || !report.enabled) notFound();

  const allowed =
    user.isAdmin || (await canUserViewReport(user.id, report.id));
  if (!allowed) notFound();

  const hasExport = Boolean(report.latestExportPath);
  // Cache-bust by lastExportedAt so a fresh export loads a fresh blob
  const cacheKey = report.lastExportedAt
    ? `?t=${report.lastExportedAt.getTime()}`
    : "";
  const fileSrc = `/api/reports/${report.id}/file${cacheKey}`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {user.isAdmin ? (
            <Link
              href={`/admin/reports/${report.id}`}
              className="text-sm text-slate-500 hover:underline"
            >
              ← Admin
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="text-sm text-slate-500 hover:underline"
            >
              ← Dashboard
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-semibold text-pp-navy">
            {report.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {report.description ?? null}
            {report.description ? " · " : ""}Last updated {formatAgo(report.lastExportedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasExport ? (
            <a
              href={`${fileSrc}${cacheKey ? "&" : "?"}download=1`}
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            >
              Download
            </a>
          ) : null}
          {user.isAdmin ? (
            <form action={exportReportNow}>
              <input type="hidden" name="id" value={report.id} />
              <button
                type="submit"
                className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Export now
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {hasExport ? (
        report.exportFormat === "PNG" ? (
          <div className="overflow-hidden rounded border border-slate-200 bg-white">
            <img
              src={fileSrc}
              alt={report.name}
              className="mx-auto block max-w-full"
            />
          </div>
        ) : (
          <PdfViewer src={fileSrc} title={report.name} />
        )
      ) : (
        <div className="rounded border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">
            No export available yet.
            {user.isAdmin ? " Click Export now above to generate one." : " Please check back soon."}
          </p>
        </div>
      )}
    </div>
  );
}
