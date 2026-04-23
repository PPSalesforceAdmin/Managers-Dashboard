import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    changed?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  const { callbackUrl, error, changed } = await searchParams;

  async function handleLogin(formData: FormData): Promise<void> {
    "use server";
    const callback = (formData.get("callbackUrl") as string) || "/dashboard";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        totp: formData.get("totp"),
        redirectTo: callback,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(
          `/login?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callback)}`,
        );
      }
      throw err;
    }
  }

  return (
    <div className="mx-auto max-w-md py-10 md:py-16">
      <div className="rounded-pp-card-lg bg-white p-6 shadow-pp-card md:p-8">
        <h1 className="mb-1 text-2xl font-bold tracking-pp-tight">Sign in</h1>
        <p className="mb-6 text-sm text-pp-body/80">
          Progressive Property managers portal
        </p>

        {changed ? (
          <p className="mb-4 rounded-pp-button bg-green-50 p-3 text-sm text-green-800 ring-1 ring-green-200">
            Password changed. Please sign in with your new password.
          </p>
        ) : null}

        <form action={handleLogin} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-pp-button border border-black/10 bg-white px-3 py-2.5 text-pp-body outline-none transition focus:border-pp-orange focus:ring-2 focus:ring-pp-orange/20"
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-pp-button border border-black/10 bg-white px-3 py-2.5 text-pp-body outline-none transition focus:border-pp-orange focus:ring-2 focus:ring-pp-orange/20"
            />
          </Field>
          <Field
            label="Authenticator code"
            htmlFor="totp"
            hint="if MFA enabled"
          >
            <input
              id="totp"
              name="totp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="w-full rounded-pp-button border border-black/10 bg-white px-3 py-2.5 text-pp-body outline-none transition focus:border-pp-orange focus:ring-2 focus:ring-pp-orange/20"
            />
          </Field>

          {error ? (
            <p className="rounded-pp-button bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
              Invalid email, password, or code.
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-pp-button-lg bg-pp-orange px-4 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-baseline justify-between text-xs font-semibold uppercase tracking-pp-nav text-pp-navy"
      >
        <span>{label}</span>
        {hint ? (
          <span className="text-[11px] font-medium normal-case tracking-normal text-pp-body/60">
            {hint}
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}
