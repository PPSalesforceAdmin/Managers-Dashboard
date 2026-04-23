import Link from "next/link";
import { requireAdmin } from "@/server/session";
import { createRole } from "@/lib/roles-actions";

export default async function NewRolePage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/roles"
          className="text-sm text-pp-body/60 hover:underline"
        >
          ← Roles
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-pp-navy">New role</h1>
      </div>

      <form
        action={createRole}
        className="space-y-4 rounded-pp-card bg-white shadow-pp-card-very-soft p-5"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-pp-navy">
            Name
          </label>
          <input
            name="name"
            required
            className="w-full rounded-pp-button border border-black/10 px-3 py-2"
            placeholder="e.g. CET Managers"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-pp-navy">
            Description
          </label>
          <input
            name="description"
            className="w-full rounded-pp-button border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Link
            href="/admin/roles"
            className="rounded-pp-button border border-black/10 px-4 py-2 text-sm hover:bg-pp-offwhite"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-pp-button-lg bg-pp-orange px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            Create role
          </button>
        </div>
      </form>
    </div>
  );
}
