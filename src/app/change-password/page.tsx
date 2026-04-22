import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="mb-4 text-2xl font-semibold text-pp-navy">
        Change your password
      </h1>
      <p className="mb-6 text-slate-600">
        You must change your password before continuing. This form will be wired
        up in the next milestone (account management).
      </p>
      <p className="text-sm text-slate-500">
        Signed in as <strong>{session.user.email}</strong>
      </p>
    </div>
  );
}
