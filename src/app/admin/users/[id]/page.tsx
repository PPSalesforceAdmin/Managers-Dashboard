import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/server/session";
import {
  updateUser,
  setUserStatus,
  resetUserPassword,
  resetUserMfa,
  setUserRoles,
  setUserReportGrants,
} from "@/lib/users-actions";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tempPassword?: string }>;
}

export default async function EditUserPage({ params, searchParams }: Props) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { tempPassword } = await searchParams;

  const [user, roles, reports, userRoles, userGrants] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.report.findMany({
      orderBy: [{ name: "asc" }],
      include: { category: true },
    }),
    prisma.userRole.findMany({ where: { userId: id }, select: { roleId: true } }),
    prisma.userReport.findMany({
      where: { userId: id },
      select: { reportId: true },
    }),
  ]);
  if (!user) notFound();

  const selectedRoleIds = new Set(userRoles.map((r) => r.roleId));
  const selectedReportIds = new Set(userGrants.map((r) => r.reportId));

  const isSelf = user.id === admin.id;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-slate-500 hover:underline"
        >
          ← Users
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-pp-navy">
          {user.email}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.status === "ACTIVE" ? "Active" : "Disabled"} ·{" "}
          {user.isAdmin ? "Administrator" : "Viewer"}
          {user.forcePasswordChange ? " · Must change password on next login" : ""}
          {user.mfaEnabled ? " · MFA enrolled" : ""}
        </p>
      </div>

      {tempPassword ? (
        <div className="rounded border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Temporary password — shown once
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Copy this and share with {user.email}. They'll be forced to change
            it on first login.
          </p>
          <code className="mt-2 inline-block rounded bg-white px-3 py-1 font-mono text-sm">
            {tempPassword}
          </code>
        </div>
      ) : null}

      <section className="rounded border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-pp-navy">Profile</h2>
        <form action={updateUser} className="grid gap-4">
          <input type="hidden" name="id" value={user.id} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              defaultValue={user.email}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isAdmin"
              defaultChecked={user.isAdmin}
              disabled={isSelf}
              className="h-4 w-4"
            />
            Administrator
            {isSelf ? (
              <span className="text-xs text-slate-500">
                (you can't demote yourself)
              </span>
            ) : null}
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-pp-navy">Roles</h2>
        <p className="mb-3 text-sm text-slate-600">
          Each role grants access to a set of reports. Overlapping roles are unioned.
        </p>
        <form action={setUserRoles} className="space-y-2">
          <input type="hidden" name="id" value={user.id} />
          {roles.length === 0 ? (
            <p className="text-sm text-slate-500">
              No roles yet.{" "}
              <Link href="/admin/roles/new" className="text-pp-orange underline">
                Create one →
              </Link>
            </p>
          ) : (
            roles.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="roleIds"
                  value={r.id}
                  defaultChecked={selectedRoleIds.has(r.id)}
                  className="h-4 w-4"
                />
                <span>
                  {r.name}
                  {r.description ? (
                    <span className="ml-2 text-slate-500">
                      — {r.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))
          )}
          {roles.length > 0 ? (
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                Save roles
              </button>
            </div>
          ) : null}
        </form>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-pp-navy">Direct report access</h2>
        <p className="mb-3 text-sm text-slate-600">
          Grant access to individual reports, in addition to anything the user
          gets via their roles.
        </p>
        <form action={setUserReportGrants} className="space-y-2">
          <input type="hidden" name="id" value={user.id} />
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">No reports to grant yet.</p>
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
                Save grants
              </button>
            </div>
          ) : null}
        </form>
      </section>

      <section className="rounded border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-pp-navy">Account actions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <form action={resetUserPassword}>
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            >
              Reset password (generates temp)
            </button>
          </form>

          {user.mfaEnabled ? (
            <form action={resetUserMfa}>
              <input type="hidden" name="id" value={user.id} />
              <button
                type="submit"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
              >
                Reset MFA (user re-enrols on next login)
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
            >
              MFA not enrolled
            </button>
          )}

          {user.status === "ACTIVE" ? (
            <form action={setUserStatus}>
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="status" value="DISABLED" />
              <button
                type="submit"
                disabled={isSelf}
                className="w-full rounded border border-red-200 px-3 py-2 text-sm text-red-600 enabled:hover:bg-red-50 disabled:opacity-40"
              >
                Disable account
              </button>
            </form>
          ) : (
            <form action={setUserStatus}>
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="status" value="ACTIVE" />
              <button
                type="submit"
                className="w-full rounded border border-green-200 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
              >
                Re-enable account
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
