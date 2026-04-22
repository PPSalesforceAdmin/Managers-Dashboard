import { prisma } from "@/lib/db";
import type { Report } from "@prisma/client";

export async function canUserViewReport(
  userId: string,
  reportId: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT r.id FROM "Report" r
    WHERE r.id = ${reportId}
      AND r.enabled = true
      AND (
        EXISTS (
          SELECT 1 FROM "UserReport" ur
          WHERE ur."userId" = ${userId} AND ur."reportId" = r.id
        )
        OR EXISTS (
          SELECT 1 FROM "RoleReport" rr
          JOIN "UserRole" uro ON uro."roleId" = rr."roleId"
          WHERE uro."userId" = ${userId} AND rr."reportId" = r.id
        )
      )
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function listUserReports(userId: string): Promise<Report[]> {
  return prisma.$queryRaw<Report[]>`
    SELECT r.* FROM "Report" r
    WHERE r.enabled = true
      AND (
        EXISTS (
          SELECT 1 FROM "UserReport" ur
          WHERE ur."userId" = ${userId} AND ur."reportId" = r.id
        )
        OR EXISTS (
          SELECT 1 FROM "RoleReport" rr
          JOIN "UserRole" uro ON uro."roleId" = rr."roleId"
          WHERE uro."userId" = ${userId} AND rr."reportId" = r.id
        )
      )
    ORDER BY r.name ASC
  `;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, status: true },
  });
  return Boolean(user && user.status === "ACTIVE" && user.isAdmin);
}
