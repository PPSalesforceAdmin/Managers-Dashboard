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
          <p className="mt-1 text-sm text-pp-body/80">
            Bundle reports together and assign the bundle to users.
          </p>
        </div>
        <Link
          href="/admin/roles/new"
          className="rounded-pp-button-lg bg-pp-orange px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
        >
          + New role
        </Link>
      </div>

      <div className="overflow-hidden rounded-pp-card bg-white shadow-pp-card-very-soft">
        <table className="w-full text-sm">
          <thead className="bg-pp-offwhite text-left text-xs uppercase tracking-pp-nav text-pp-body/60">
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
              <tr key={r.id} className="border-t border-black/5">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-pp-body/60">
                  {r.description ?? "—"}
                </td>
                <td className="px-4 py-2 text-pp-body/60">{r._count.users}</td>
                <td className="px-4 py-2 text-pp-body/60">{r._count.reports}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/roles/${r.id}`}
                    className="rounded-pp-button border border-black/10 px-2 py-1 text-xs hover:bg-pp-offwhite"
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
