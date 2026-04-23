"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/server/session";
import { canUserViewReport } from "@/lib/authz";
import { logAuditEvent } from "@/server/audit";

export async function toggleFavourite(formData: FormData): Promise<void> {
  const user = await requireUser();
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) return;

  // Only allow favouriting reports the user can actually see.
  const allowed =
    user.isAdmin || (await canUserViewReport(user.id, reportId));
  if (!allowed) return;

  const existing = await prisma.favourite.findUnique({
    where: { userId_reportId: { userId: user.id, reportId } },
  });

  if (existing) {
    await prisma.favourite.delete({
      where: { userId_reportId: { userId: user.id, reportId } },
    });
    await logAuditEvent({
      userId: user.id,
      action: "favourite_remove",
      targetId: reportId,
    });
  } else {
    await prisma.favourite.create({
      data: { userId: user.id, reportId },
    });
    await logAuditEvent({
      userId: user.id,
      action: "favourite_add",
      targetId: reportId,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
}
