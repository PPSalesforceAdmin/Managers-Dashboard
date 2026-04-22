import type { Report } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TableauClient } from "@/lib/tableau/client";
import { writeReportFile, writeReportThumbnail } from "@/lib/storage";
import type { TableauOrientation } from "@/lib/tableau/types";

function orientationToApi(o: Report["orientation"]): TableauOrientation {
  return o === "PORTRAIT" ? "portrait" : "landscape";
}

function parseFilterParams(raw: Report["filterParams"]): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === null || v === undefined) continue;
    out[k] = String(v);
  }
  return out;
}

export async function exportReport(
  report: Report,
  client: TableauClient,
): Promise<void> {
  const run = await prisma.exportRun.create({
    data: { reportId: report.id, status: "PENDING" },
  });

  try {
    const filterParams = parseFilterParams(report.filterParams);

    let exportKey: string;
    let thumbnailKey: string | null = null;
    let fileSize: number;

    if (report.exportFormat === "PDF") {
      const pdf = await client.exportViewPdf(report.tableauViewId, {
        orientation: orientationToApi(report.orientation),
        filterParams,
      });
      exportKey = await writeReportFile(report.id, "latest.pdf", pdf);
      fileSize = pdf.byteLength;

      const thumb = await generatePdfThumbnail(pdf);
      if (thumb) {
        thumbnailKey = await writeReportThumbnail(report.id, thumb);
      }
    } else {
      const png = await client.exportViewPng(report.tableauViewId, {
        filterParams,
      });
      exportKey = await writeReportFile(report.id, "latest.png", png);
      thumbnailKey = await writeReportThumbnail(report.id, png);
      fileSize = png.byteLength;
    }

    await prisma.$transaction([
      prisma.report.update({
        where: { id: report.id },
        data: {
          latestExportPath: exportKey,
          latestThumbnailPath: thumbnailKey,
          lastExportedAt: new Date(),
          lastExportStatus: "SUCCESS",
        },
      }),
      prisma.exportRun.update({
        where: { id: run.id },
        data: {
          completedAt: new Date(),
          status: "SUCCESS",
          filePath: exportKey,
          fileSizeBytes: fileSize,
        },
      }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.$transaction([
      prisma.report.update({
        where: { id: report.id },
        data: { lastExportStatus: "FAILED" },
      }),
      prisma.exportRun.update({
        where: { id: run.id },
        data: {
          completedAt: new Date(),
          status: "FAILED",
          errorMessage: message,
        },
      }),
    ]);
    throw err;
  }
}

// Thumbnail generation is wired up in a later milestone (needs pdf-to-img).
// Returning null here is fine — the Report row simply stores no thumbnail key.
async function generatePdfThumbnail(_pdf: Buffer): Promise<Buffer | null> {
  return null;
}
