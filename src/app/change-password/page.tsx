import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/account-actions";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  "too-short": "New password must be at least 12 characters.",
  mismatch: "New password and confirmation don't match.",
  same: "New password can't match your current one.",
  "current-wrong": "Current password is incorrect.",
};

export default async function ChangePasswordPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  async function handleSignOut(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-pp-navy">
            Change your password
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as <strong>{session.user.email}</strong>
          </p>
        </div>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
      </div>

      {session.user.forcePasswordChange ? (
        <p className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          You must change your temporary password before continuing.
        </p>
      ) : null}

      <form
        action={changeOwnPassword}
        className="space-y-4 rounded border border-slate-200 bg-white p-5"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Current password
          </label>
          <input
            type="password"
            name="current"
            required
            autoComplete="current-password"
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            type="password"
            name="next"
            required
            minLength={12}
            autoComplete="new-password"
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-slate-500">Minimum 12 characters.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Confirm new password
          </label>
          <input
            type="password"
            name="confirm"
            required
            minLength={12}
            autoComplete="new-password"
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-600">{errorMessage}</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded bg-pp-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Change password
          </button>
        </div>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        After changing, you'll be signed out and asked to sign in again with the
        new password.
      </p>
    </div>
  );
}
