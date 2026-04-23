import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canUserViewReport } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      enabled: true,
      lastExportedAt: true,
      lastExportStatus: true,
    },
  });
  if (!report || !report.enabled) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const allowed =
    session.user.isAdmin ||
    (await canUserViewReport(session.user.id, report.id));
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    {
      id: report.id,
      lastExportedAt: report.lastExportedAt?.toISOString() ?? null,
      lastExportStatus: report.lastExportStatus,
    },
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
