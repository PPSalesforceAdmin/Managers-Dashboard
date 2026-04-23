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
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-6 text-2xl font-semibold text-pp-navy">Sign in</h1>
      {changed ? (
        <p className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Password changed. Please sign in with your new password.
        </p>
      ) : null}
      <form action={handleLogin} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
        <div>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-pp-orange focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-pp-orange focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="totp">
            Authenticator code <span className="text-slate-500">(if enabled)</span>
          </label>
          <input
            id="totp"
            name="totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-pp-orange focus:outline-none"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-600">
            Invalid email, password, or code.
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded bg-pp-orange px-4 py-2 font-medium text-white hover:bg-orange-600"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
