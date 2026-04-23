"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth, signOut } from "@/lib/auth";
import { logAuditEvent } from "@/server/audit";

const MIN_LENGTH = 12;

export async function changeOwnPassword(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < MIN_LENGTH) {
    redirect(`/change-password?error=too-short`);
  }
  if (next !== confirm) {
    redirect(`/change-password?error=mismatch`);
  }
  if (next === current) {
    redirect(`/change-password?error=same`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) redirect("/login");

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) {
    redirect(`/change-password?error=current-wrong`);
  }

  const passwordHash = await bcrypt.hash(next, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, forcePasswordChange: false },
  });

  await logAuditEvent({ userId: user.id, action: "password_change" });

  // Force re-login so the JWT's forcePasswordChange flag is cleared.
  await signOut({ redirectTo: "/login?changed=1" });
}
