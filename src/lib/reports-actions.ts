"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TableauClient } from "@/lib/tableau/client";
import { logAuditEvent } from "@/server/audit";
import { requireAdmin } from "@/server/session";
import { exportReport } from "../../worker/exporter";

const ORIENTATIONS = new Set(["LANDSCAPE", "PORTRAIT"]);
const FORMATS = new Set(["PDF", "PNG"]);

function parseJsonObject(raw: string): Prisma.InputJsonValue | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Prisma.InputJsonValue;
    }
  } catch {
    // fallthrough
  }
  throw new Error("filterParams must be a JSON object, e.g. {\"vf_Region\":\"North\"}");
}

export async function createReport(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const tableauViewId = String(formData.get("tableauViewId") ?? "").trim();
  const tableauContentUrl =
    String(formData.get("tableauContentUrl") ?? "").trim() || "";
  const filterParamsRaw = String(formData.get("filterParams") ?? "");
  const orientation = String(formData.get("orientation") ?? "LANDSCAPE");
  const exportFormat = String(formData.get("exportFormat") ?? "PDF");
  const refreshCron = String(formData.get("refreshCron") ?? "0 * * * *").trim();
  const enabled = formData.get("enabled") === "on";

  if (!name) throw new Error("Name is required");
  if (!tableauViewId) throw new Error("Tableau view LUID is required");
  if (!ORIENTATIONS.has(orientation)) throw new Error("Invalid orientation");
  if (!FORMATS.has(exportFormat)) throw new Error("Invalid export format");

  const filterParams = parseJsonObject(filterParamsRaw);

  const created = await prisma.report.create({
    data: {
      name,
      description,
      categoryId,
      tableauViewId,
      tableauContentUrl,
      filterParams: filterParams ?? Prisma.DbNull,
      orientation: orientation as "LANDSCAPE" | "PORTRAIT",
      exportFormat: exportFormat as "PDF" | "PNG",
      refreshCron,
      enabled,
    },
  });

  await logAuditEvent({
    userId: admin.id,
    action: "admin_report_create",
    targetId: created.id,
  });
  revalidatePath("/admin/reports");
  redirect(`/admin/reports/${created.id}`);
}

export async function updateReport(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Report id missing");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const tableauViewId = String(formData.get("tableauViewId") ?? "").trim();
  const tableauContentUrl =
    String(formData.get("tableauContentUrl") ?? "").trim() || "";
  const filterParamsRaw = String(formData.get("filterParams") ?? "");
  const orientation = String(formData.get("orientation") ?? "LANDSCAPE");
  const exportFormat = String(formData.get("exportFormat") ?? "PDF");
  const refreshCron = String(formData.get("refreshCron") ?? "0 * * * *").trim();
  const enabled = formData.get("enabled") === "on";

  if (!name) throw new Error("Name is required");
  if (!tableauViewId) throw new Error("Tableau view LUID is required");

  const filterParams = parseJsonObject(filterParamsRaw);

  await prisma.report.update({
    where: { id },
    data: {
      name,
      description,
      categoryId,
      tableauViewId,
      tableauContentUrl,
      filterParams: filterParams ?? Prisma.DbNull,
      orientation: orientation as "LANDSCAPE" | "PORTRAIT",
      exportFormat: exportFormat as "PDF" | "PNG",
      refreshCron,
      enabled,
    },
  });

  await logAuditEvent({
    userId: admin.id,
    action: "admin_report_update",
    targetId: id,
  });
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${id}`);
}

export async function deleteReport(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.report.delete({ where: { id } });
  await logAuditEvent({
    userId: admin.id,
    action: "admin_report_delete",
    targetId: id,
  });
  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}

export async function exportReportNow(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw new Error("Report not found");

  const tableau = TableauClient.fromEnv();
  await tableau.signIn();
  try {
    await exportReport(report, tableau);
  } finally {
    await tableau.signOut();
  }

  await logAuditEvent({
    userId: admin.id,
    action: "admin_report_export_now",
    targetId: id,
  });
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${id}`);
  revalidatePath(`/reports/${id}`);
}
