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
    <div className="mx-auto max-w-md py-8 md:py-12">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-pp-tight">
            Change your password
          </h1>
          <p className="mt-1 text-sm text-pp-body/70">
            Signed in as <strong>{session.user.email}</strong>
          </p>
        </div>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="rounded-pp-button border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold text-pp-navy hover:bg-pp-offwhite"
          >
            Sign out
          </button>
        </form>
      </div>

      {session.user.forcePasswordChange ? (
        <p className="mb-4 rounded-pp-button bg-pp-amber/15 p-3 text-sm text-pp-navy ring-1 ring-pp-amber/40">
          You must change your temporary password before continuing.
        </p>
      ) : null}

      <form
        action={changeOwnPassword}
        className="space-y-4 rounded-pp-card-lg bg-white p-6 shadow-pp-card-soft"
      >
        <PasswordField
          label="Current password"
          name="current"
          autoComplete="current-password"
        />
        <PasswordField
          label="New password"
          name="next"
          autoComplete="new-password"
          hint="Minimum 12 characters."
        />
        <PasswordField
          label="Confirm new password"
          name="confirm"
          autoComplete="new-password"
        />

        {errorMessage ? (
          <p className="rounded-pp-button bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-pp-button-lg bg-pp-orange px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            Change password
          </button>
        </div>
      </form>

      <p className="mt-4 text-xs text-pp-body/60">
        After changing, you'll be signed out and asked to sign in again with
        the new password.
      </p>
    </div>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-pp-nav text-pp-navy"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="password"
        required
        minLength={name === "current" ? undefined : 12}
        autoComplete={autoComplete}
        className="w-full rounded-pp-button border border-black/10 bg-white px-3 py-2.5 text-pp-body outline-none transition focus:border-pp-orange focus:ring-2 focus:ring-pp-orange/20"
      />
      {hint ? (
        <p className="mt-1 text-xs text-pp-body/60">{hint}</p>
      ) : null}
    </div>
  );
}
