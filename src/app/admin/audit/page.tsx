import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/server/session";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{
    user?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

function parseDate(input: string | undefined): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return Number.isFinite(d.getTime()) ? d : null;
}

export default async function AuditLogPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;

  const userId = (sp.user ?? "").trim() || null;
  const action = (sp.action ?? "").trim() || null;
  const from = parseDate(sp.from);
  const to = parseDate(sp.to);
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const where: Prisma.AuditLogWhereInput = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const [entries, total, users, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.user.findMany({
      orderBy: [{ email: "asc" }],
      select: { id: true, email: true, name: true },
    }),
    prisma.$queryRaw<{ action: string }[]>`
      SELECT DISTINCT action FROM "AuditLog" ORDER BY action ASC
    `,
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(n: number): string {
    const params = new URLSearchParams();
    if (userId) params.set("user", userId);
    if (action) params.set("action", action);
    if (sp.from) params.set("from", sp.from);
    if (sp.to) params.set("to", sp.to);
    params.set("page", String(n));
    return `/admin/audit?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-pp-navy">Audit log</h1>
        <p className="mt-1 text-sm text-pp-body/80">
          Every login, report view, download, and admin action. Showing{" "}
          {entries.length} of {total.toLocaleString()} entries.
        </p>
      </div>

      <form
        method="get"
        action="/admin/audit"
        className="grid gap-3 rounded-pp-card bg-white p-4 shadow-pp-card-very-soft md:grid-cols-[2fr_2fr_1fr_1fr_auto]"
      >
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-pp-nav text-pp-body/60">
            User
          </label>
          <select
            name="user"
            defaultValue={userId ?? ""}
            className="w-full rounded-pp-button border border-black/10 px-3 py-2"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ? `${u.name} — ${u.email}` : u.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-pp-nav text-pp-body/60">
            Action
          </label>
          <select
            name="action"
            defaultValue={action ?? ""}
            className="w-full rounded-pp-button border border-black/10 px-3 py-2"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-pp-nav text-pp-body/60">
            From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={sp.from ?? ""}
            className="w-full rounded-pp-button border border-black/10 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-pp-nav text-pp-body/60">
            To
          </label>
          <input
            type="date"
            name="to"
            defaultValue={sp.to ?? ""}
            className="w-full rounded-pp-button border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-pp-button-lg bg-pp-orange px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            Filter
          </button>
          <Link
            href="/admin/audit"
            className="rounded-pp-button border border-black/10 px-3 py-2 text-sm font-semibold text-pp-navy hover:bg-pp-offwhite"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-pp-card bg-white shadow-pp-card-very-soft">
        <table className="w-full text-sm">
          <thead className="bg-pp-offwhite text-left text-xs uppercase tracking-pp-nav text-pp-body/60">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Target</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-pp-body/60">
                  No entries match these filters.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-t border-black/5">
                  <td className="px-4 py-2 text-pp-body/60 whitespace-nowrap">
                    {e.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-4 py-2">
                    {e.user ? (
                      <span>
                        {e.user.name ?? e.user.email}
                        {e.user.name ? (
                          <span className="ml-1 text-xs text-pp-body/50">
                            {e.user.email}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-pp-body/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
                  <td className="px-4 py-2 font-mono text-xs text-pp-body/60">
                    {e.targetId ?? ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-pp-body/60">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-pp-button border border-black/10 px-3 py-1.5 hover:bg-pp-offwhite"
              >
                ← Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-pp-button border border-black/10 px-3 py-1.5 hover:bg-pp-offwhite"
              >
                Next →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
