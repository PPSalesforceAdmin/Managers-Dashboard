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
          className="text-sm text-pp-body/60 hover:underline"
        >
          ← Users
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-pp-navy">New user</h1>
        <p className="mt-1 text-sm text-pp-body/80">
          A 12-character temp password will be generated. It's shown once on
          the next screen — copy it and share via your normal channel.
        </p>
      </div>

      <form
        action={createUser}
        className="space-y-4 rounded-pp-card bg-white shadow-pp-card-very-soft p-5"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-pp-navy">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="off"
            className="w-full rounded-pp-button border border-black/10 px-3 py-2"
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
            className="rounded-pp-button border border-black/10 px-4 py-2 text-sm hover:bg-pp-offwhite"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-pp-button-lg bg-pp-orange px-5 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            Create user
          </button>
        </div>
      </form>
    </div>
  );
}
