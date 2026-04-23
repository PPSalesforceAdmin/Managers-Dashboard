import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/server/session";
import { createReport } from "@/lib/reports-actions";
import { ReportFormFields } from "@/components/ui/ReportFormFields";

export default async function NewReportPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/reports"
          className="text-sm text-pp-body/60 hover:underline"
        >
          ← Reports
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-pp-navy">New report</h1>
      </div>

      <form
        action={createReport}
        className="rounded-pp-card bg-white shadow-pp-card-very-soft p-5"
      >
        <ReportFormFields categories={categories} />
        <div className="mt-6 flex justify-end gap-2">
          <Link
            href="/admin/reports"
            className="rounded-pp-button border border-black/10 px-4 py-2 text-sm hover:bg-pp-offwhite"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-pp-button-lg bg-pp-orange px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            Create report
          </button>
        </div>
      </form>
    </div>
  );
}
