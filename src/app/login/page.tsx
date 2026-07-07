import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Only progressiveproperty.co.uk Google accounts can sign in. If your account has been disabled, contact an admin.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  const { callbackUrl, error } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Something went wrong signing you in.")
    : null;

  async function handleGoogleSignIn(): Promise<void> {
    "use server";
    await signIn("google", { redirectTo: callbackUrl || "/dashboard" });
  }

  return (
    <div className="mx-auto max-w-md py-10 md:py-16">
      <div className="rounded-pp-card-lg bg-white p-6 shadow-pp-card md:p-8">
        <h1 className="mb-1 text-2xl font-bold tracking-pp-tight">Sign in</h1>
        <p className="mb-6 text-sm text-pp-body/80">
          Progressive Property managers portal
        </p>

        {errorMessage ? (
          <p className="mb-4 rounded-pp-button bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
            {errorMessage}
          </p>
        ) : null}

        <form action={handleGoogleSignIn}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-pp-button-lg bg-pp-orange px-4 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </form>

        <p className="mt-4 text-xs text-pp-body/60">
          Sign-in is restricted to progressiveproperty.co.uk Google accounts.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 11v2.8h6.5c-.3 1.6-2 4.7-6.5 4.7-3.9 0-7.1-3.2-7.1-7.2s3.2-7.2 7.1-7.2c2.2 0 3.7.9 4.6 1.7l3.1-3C17.7 1 15.1 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.9 0 11.5-4.9 11.5-11.7 0-.8-.1-1.4-.2-2H12z"
      />
    </svg>
  );
}
