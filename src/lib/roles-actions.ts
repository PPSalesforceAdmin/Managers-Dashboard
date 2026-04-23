"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/server/audit";
import { requireAdmin } from "@/server/session";

export async function createRole(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("Name required");
  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) throw new Error("A role with that name already exists");
  const created = await prisma.role.create({ data: { name, description } });
  await logAuditEvent({
    userId: admin.id,
    action: "admin_role_create",
    targetId: created.id,
  });
  revalidatePath("/admin/roles");
  redirect(`/admin/roles/${created.id}`);
}

export async function updateRole(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!id || !name) throw new Error("Id + name required");
  await prisma.role.update({ where: { id }, data: { name, description } });
  await logAuditEvent({
    userId: admin.id,
    action: "admin_role_update",
    targetId: id,
  });
  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${id}`);
}

export async function deleteRole(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.role.delete({ where: { id } });
  await logAuditEvent({
    userId: admin.id,
    action: "admin_role_delete",
    targetId: id,
  });
  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}

export async function setRoleReports(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const reportIds = formData.getAll("reportIds").map(String).filter(Boolean);

  await prisma.$transaction([
    prisma.roleReport.deleteMany({ where: { roleId: id } }),
    ...(reportIds.length > 0
      ? [
          prisma.roleReport.createMany({
            data: reportIds.map((reportId) => ({ roleId: id, reportId })),
          }),
        ]
      : []),
  ]);
  await logAuditEvent({
    userId: admin.id,
    action: "admin_role_reports_set",
    targetId: id,
  });
  revalidatePath(`/admin/roles/${id}`);
}
