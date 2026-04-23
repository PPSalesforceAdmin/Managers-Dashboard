import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readReportFile } from "@/lib/storage";
import { logAuditEvent } from "@/server/audit";

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
  }
  return Buffer.concat(chunks);
}

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report || !report.enabled) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Phase 2: admin-only. Phase 3 will add role/user grants check here.
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!report.latestExportPath) {
    return NextResponse.json(
      { error: "no export available yet" },
      { status: 404 },
    );
  }

  const [reportId, ...filenameParts] = report.latestExportPath.split("/");
  const filename = filenameParts.join("/");
  if (!reportId || !filename) {
    return NextResponse.json({ error: "invalid path" }, { status: 500 });
  }

  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";
  const contentType = report.exportFormat === "PNG"
    ? "image/png"
    : "application/pdf";
  const downloadName = `${report.name.replace(/[^a-z0-9-_]+/gi, "-")}.${
    report.exportFormat === "PNG" ? "png" : "pdf"
  }`;
  const disposition = download
    ? `attachment; filename="${downloadName}"`
    : `inline; filename="${downloadName}"`;

  await logAuditEvent({
    userId: session.user.id,
    action: download ? "download_report" : "view_report",
    targetId: report.id,
  });

  await prisma.reportView.create({
    data: { userId: session.user.id, reportId: report.id },
  });

  const nodeStream = await readReportFile(reportId, filename);
  const body = await streamToBuffer(nodeStream);

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
      "Content-Length": String(body.byteLength),
    },
  });
}
