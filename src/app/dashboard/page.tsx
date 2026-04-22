import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  async function handleSignOut(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-pp-navy">
            Welcome, {session.user.email}
          </h1>
          <p className="mt-1 text-slate-600">
            {session.user.isAdmin ? "Administrator" : "Viewer"} —{" "}
            <span className="text-slate-500">
              dashboard placeholder, feature work comes next
            </span>
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
    </div>
  );
}
