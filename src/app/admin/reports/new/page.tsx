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
          className="text-sm text-slate-500 hover:underline"
        >
          ← Reports
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-pp-navy">New report</h1>
      </div>

      <form
        action={createReport}
        className="rounded border border-slate-200 bg-white p-5"
      >
        <ReportFormFields categories={categories} />
        <div className="mt-6 flex justify-end gap-2">
          <Link
            href="/admin/reports"
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Create report
          </button>
        </div>
      </form>
    </div>
  );
}
