import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/server/session";

export default async function RolesAdminPage() {
  await requireAdmin();
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, reports: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-pp-navy">Roles</h1>
          <p className="mt-1 text-sm text-slate-600">
            Bundle reports together and assign the bundle to users.
          </p>
        </div>
        <Link
          href="/admin/roles/new"
          className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          + New role
        </Link>
      </div>

      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Users</th>
              <th className="px-4 py-2">Reports</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-slate-500">
                  {r.description ?? "—"}
                </td>
                <td className="px-4 py-2 text-slate-500">{r._count.users}</td>
                <td className="px-4 py-2 text-slate-500">{r._count.reports}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/roles/${r.id}`}
                    className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
