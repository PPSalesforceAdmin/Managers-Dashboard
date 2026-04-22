import { CronExpressionParser } from "cron-parser";
import type { Report } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function findDueReports(now: Date = new Date()): Promise<Report[]> {
  const candidates = await prisma.report.findMany({
    where: { enabled: true },
  });

  const due: Report[] = [];
  for (const r of candidates) {
    try {
      const interval = CronExpressionParser.parse(r.refreshCron, {
        currentDate: now,
      });
      const lastScheduled = interval.prev().toDate();
      if (!r.lastExportedAt || r.lastExportedAt < lastScheduled) {
        due.push(r);
      }
    } catch (err) {
      console.error(
        `Skipping report ${r.id} (${r.name}) — invalid refreshCron "${r.refreshCron}"`,
        err,
      );
    }
  }
  return due;
}
