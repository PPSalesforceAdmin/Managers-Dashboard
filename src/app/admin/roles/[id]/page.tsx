import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/server/session";
import {
  updateRole,
  deleteRole,
  setRoleReports,
} from "@/lib/roles-actions";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [role, reports, roleReports] = await Promise.all([
    prisma.role.findUnique({ where: { id } }),
    prisma.report.findMany({
      orderBy: [{ name: "asc" }],
      include: { category: true },
    }),
    prisma.roleReport.findMany({ where: { roleId: id }, select: { reportId: true } }),
  ]);
  if (!role) notFound();

  const selectedReportIds = new Set(roleReports.map((r) => r.reportId));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/roles"
          className="text-sm text-slate-500 hover:underline"
        >
          ← Roles
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-pp-navy">{role.name}</h1>
      </div>

      <section className="rounded border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-pp-navy">Details</h2>
        <form action={updateRole} className="grid gap-4">
          <input type="hidden" name="id" value={role.id} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              name="name"
              required
              defaultValue={role.name}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <input
              name="description"
              defaultValue={role.description ?? ""}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="flex justify-between">
            <form action={deleteRole}>
              <input type="hidden" name="id" value={role.id} />
              <button
                type="submit"
                className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Delete role
              </button>
            </form>
            <button
              type="submit"
              className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Save details
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-pp-navy">Reports in this role</h2>
        <p className="mb-3 text-sm text-slate-600">
          Anyone assigned this role gets access to the reports ticked below.
        </p>
        <form action={setRoleReports} className="space-y-2">
          <input type="hidden" name="id" value={role.id} />
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">No reports yet.</p>
          ) : (
            <div className="grid gap-1 md:grid-cols-2">
              {reports.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="reportIds"
                    value={r.id}
                    defaultChecked={selectedReportIds.has(r.id)}
                    className="h-4 w-4"
                  />
                  <span>
                    {r.name}
                    {r.category ? (
                      <span className="ml-2 text-xs text-slate-500">
                        [{r.category.name}]
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          )}
          {reports.length > 0 ? (
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                Save reports
              </button>
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}
