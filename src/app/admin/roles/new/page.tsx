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
          className="text-sm text-slate-500 hover:underline"
        >
          ← Roles
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-pp-navy">New role</h1>
      </div>

      <form
        action={createRole}
        className="space-y-4 rounded border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            name="name"
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="e.g. CET Managers"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <input
            name="description"
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Link
            href="/admin/roles"
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Create role
          </button>
        </div>
      </form>
    </div>
  );
}
