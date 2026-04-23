import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireAdmin(): Promise<{
  id: string;
  email: string;
  isAdmin: boolean;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    redirect("/dashboard");
  }
  return {
    id: session.user.id,
    email: session.user.email,
    isAdmin: session.user.isAdmin,
  };
}

export async function requireUser(): Promise<{
  id: string;
  email: string;
  isAdmin: boolean;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return {
    id: session.user.id,
    email: session.user.email,
    isAdmin: session.user.isAdmin,
  };
}
