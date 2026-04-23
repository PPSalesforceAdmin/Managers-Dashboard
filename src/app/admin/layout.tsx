import Link from "next/link";
import { requireAdmin } from "@/server/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <nav className="sticky top-4 flex h-fit flex-col gap-0.5 rounded-pp-card bg-white p-3 text-sm shadow-pp-card-very-soft">
        <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-pp-nav text-pp-body/60">
          Admin
        </p>
        <NavLink href="/admin/categories">Categories</NavLink>
        <NavLink href="/admin/reports">Reports</NavLink>
        <NavLink href="/admin/users">Users</NavLink>
        <NavLink href="/admin/roles">Roles</NavLink>
        <div className="my-2 border-t border-black/5" />
        <NavLink href="/dashboard" muted>
          ← Back to dashboard
        </NavLink>
      </nav>
      <section>{children}</section>
    </div>
  );
}

function NavLink({
  href,
  children,
  muted = false,
}: {
  href: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-pp-button px-2 py-1.5 font-medium transition hover:bg-pp-offwhite ${
        muted ? "text-pp-body/60" : "text-pp-navy"
      }`}
    >
      {children}
    </Link>
  );
}
