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
  const report = await prisma.report.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!report || !report.enabled) notFound();

  const allowed =
    user.isAdmin || (await canUserViewReport(user.id, report.id));
  if (!allowed) notFound();

  const hasExport = Boolean(report.latestExportPath);
  const cacheKey = report.lastExportedAt
    ? `?t=${report.lastExportedAt.getTime()}`
    : "";
  const fileSrc = `/api/reports/${report.id}/file${cacheKey}`;
  const downloadHref = `${fileSrc}${cacheKey ? "&" : "?"}download=1`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {user.isAdmin ? (
            <Link
              href={`/admin/reports/${report.id}`}
              className="text-xs font-semibold uppercase tracking-pp-nav text-pp-body/60 hover:text-pp-orange"
            >
              ← Admin
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="text-xs font-semibold uppercase tracking-pp-nav text-pp-body/60 hover:text-pp-orange"
            >
              ← Dashboard
            </Link>
          )}
          <div className="mt-2 flex items-center gap-3">
            {report.category ? (
              <span className="inline-flex items-center rounded-pp-pill bg-pp-navy/5 px-3 py-1 text-[11px] font-bold uppercase tracking-pp-nav text-pp-navy">
                {report.category.name}
              </span>
            ) : null}
            <p className="text-xs font-medium text-pp-body/60">
              Last updated {formatAgo(report.lastExportedAt)}
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-pp-tight md:text-3xl">
            {report.name}
          </h1>
          {report.description ? (
            <p className="mt-1 text-sm text-pp-body/70">{report.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasExport ? (
            <a
              href={downloadHref}
              className="rounded-pp-button border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-pp-navy shadow-pp-card-very-soft transition hover:bg-pp-offwhite"
            >
              Download
            </a>
          ) : null}
          {user.isAdmin ? (
            <form action={exportReportNow}>
              <input type="hidden" name="id" value={report.id} />
              <button
                type="submit"
                className="rounded-pp-button-lg bg-pp-orange px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
              >
                Export now
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {hasExport ? (
        report.exportFormat === "PNG" ? (
          <div className="overflow-hidden rounded-pp-card bg-white shadow-pp-card-soft">
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
        <div className="rounded-pp-card-lg bg-white p-10 text-center shadow-pp-card-very-soft">
          <p className="text-pp-body/80">
            No export available yet.
            {user.isAdmin
              ? " Click Export now above to generate one."
              : " Please check back soon."}
          </p>
        </div>
      )}
    </div>
  );
}
