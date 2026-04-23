"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/server/audit";
import { requireAdmin } from "@/server/session";
import { generateTempPassword } from "@/lib/passwords";

export async function createUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const isAdmin = formData.get("isAdmin") === "on";
  if (!email || !email.includes("@")) throw new Error("Valid email required");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with that email already exists");

  const tempPassword = generateTempPassword(12);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      isAdmin,
      status: "ACTIVE",
      mfaEnabled: false,
      forcePasswordChange: true,
    },
  });

  await logAuditEvent({
    userId: admin.id,
    action: "admin_user_create",
    targetId: user.id,
  });

  revalidatePath("/admin/users");
  redirect(`/admin/users/${user.id}?tempPassword=${encodeURIComponent(tempPassword)}`);
}

export async function updateUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("User id missing");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const isAdmin = formData.get("isAdmin") === "on";
  if (!email || !email.includes("@")) throw new Error("Valid email required");

  await prisma.user.update({
    where: { id },
    data: { email, isAdmin },
  });
  await logAuditEvent({
    userId: admin.id,
    action: "admin_user_update",
    targetId: id,
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}

export async function setUserStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("status") ?? "");
  if (!id || (next !== "ACTIVE" && next !== "DISABLED")) return;
  if (id === admin.id && next === "DISABLED") {
    throw new Error("You cannot disable your own account.");
  }
  await prisma.user.update({
    where: { id },
    data: { status: next as "ACTIVE" | "DISABLED" },
  });
  await logAuditEvent({
    userId: admin.id,
    action: next === "DISABLED" ? "admin_user_disable" : "admin_user_enable",
    targetId: id,
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}

export async function resetUserPassword(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const tempPassword = generateTempPassword(12);
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  await prisma.user.update({
    where: { id },
    data: { passwordHash, forcePasswordChange: true },
  });
  await logAuditEvent({
    userId: admin.id,
    action: "admin_user_password_reset",
    targetId: id,
  });
  revalidatePath(`/admin/users/${id}`);
  redirect(`/admin/users/${id}?tempPassword=${encodeURIComponent(tempPassword)}`);
}

export async function resetUserMfa(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.user.update({
    where: { id },
    data: { mfaEnabled: false, mfaSecret: null },
  });
  await logAuditEvent({
    userId: admin.id,
    action: "admin_user_mfa_reset",
    targetId: id,
  });
  revalidatePath(`/admin/users/${id}`);
}

export async function setUserRoles(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const roleIds = formData.getAll("roleIds").map(String).filter(Boolean);

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId: id } }),
    ...(roleIds.length > 0
      ? [
          prisma.userRole.createMany({
            data: roleIds.map((roleId) => ({ userId: id, roleId })),
          }),
        ]
      : []),
  ]);
  await logAuditEvent({
    userId: admin.id,
    action: "admin_user_roles_set",
    targetId: id,
  });
  revalidatePath(`/admin/users/${id}`);
}

export async function setUserReportGrants(
  formData: FormData,
): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const reportIds = formData.getAll("reportIds").map(String).filter(Boolean);

  await prisma.$transaction([
    prisma.userReport.deleteMany({ where: { userId: id } }),
    ...(reportIds.length > 0
      ? [
          prisma.userReport.createMany({
            data: reportIds.map((reportId) => ({ userId: id, reportId })),
          }),
        ]
      : []),
  ]);
  await logAuditEvent({
    userId: admin.id,
    action: "admin_user_grants_set",
    targetId: id,
  });
  revalidatePath(`/admin/users/${id}`);
}
