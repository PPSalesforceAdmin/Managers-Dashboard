import Link from "next/link";
import { requireAdmin } from "@/server/session";
import { createUser } from "@/lib/users-actions";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-slate-500 hover:underline"
        >
          ← Users
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-pp-navy">New user</h1>
        <p className="mt-1 text-sm text-slate-600">
          A 12-character temp password will be generated. It's shown once on
          the next screen — copy it and share via your normal channel.
        </p>
      </div>

      <form
        action={createUser}
        className="space-y-4 rounded border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="off"
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="user@progressiveproperty.co.uk"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isAdmin" className="h-4 w-4" />
          Grant administrator rights
        </label>

        <div className="flex justify-end gap-2">
          <Link
            href="/admin/users"
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Create user
          </button>
        </div>
      </form>
    </div>
  );
}
