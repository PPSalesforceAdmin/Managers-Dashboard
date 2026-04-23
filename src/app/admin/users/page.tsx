import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/server/session";

function formatAgo(d: Date | null): string {
  if (!d) return "never";
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} d ago`;
}

export default async function UsersAdminPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: { _count: { select: { roles: true, reportGrants: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-pp-navy">Users</h1>
          <p className="mt-1 text-sm text-pp-body/80">
            Create viewers, grant report access, reset passwords, toggle
            admin rights. Users are never hard-deleted — disable instead.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="rounded-pp-button-lg bg-pp-orange px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
        >
          + New user
        </Link>
      </div>

      <div className="overflow-hidden rounded-pp-card bg-white shadow-pp-card-very-soft">
        <table className="w-full text-sm">
          <thead className="bg-pp-offwhite text-left text-xs uppercase tracking-pp-nav text-pp-body/60">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Admin</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Roles</th>
              <th className="px-4 py-2">Direct grants</th>
              <th className="px-4 py-2">Last login</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-black/5">
                <td className="px-4 py-2 font-medium">{u.email}</td>
                <td className="px-4 py-2 text-pp-body/60">{u.isAdmin ? "Yes" : "No"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${
                      u.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-200 text-pp-body/80"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-pp-body/60">{u._count.roles}</td>
                <td className="px-4 py-2 text-pp-body/60">{u._count.reportGrants}</td>
                <td className="px-4 py-2 text-pp-body/60">
                  {formatAgo(u.lastLoginAt)}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
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
