import Link from "next/link";
import { requireAdmin } from "@/server/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav className="flex flex-col gap-1 rounded border border-slate-200 bg-white p-3 text-sm">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Admin
        </p>
        <Link
          href="/admin/categories"
          className="rounded px-2 py-1.5 hover:bg-slate-100"
        >
          Categories
        </Link>
        <Link
          href="/admin/reports"
          className="rounded px-2 py-1.5 hover:bg-slate-100"
        >
          Reports
        </Link>
        <Link
          href="/admin/users"
          className="rounded px-2 py-1.5 hover:bg-slate-100"
        >
          Users
        </Link>
        <Link
          href="/admin/roles"
          className="rounded px-2 py-1.5 hover:bg-slate-100"
        >
          Roles
        </Link>
        <div className="my-2 border-t border-slate-200" />
        <Link
          href="/dashboard"
          className="rounded px-2 py-1.5 text-slate-600 hover:bg-slate-100"
        >
          ← Back to dashboard
        </Link>
      </nav>
      <section>{children}</section>
    </div>
  );
}
