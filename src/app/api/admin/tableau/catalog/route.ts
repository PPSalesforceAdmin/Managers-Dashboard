import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TableauClient } from "@/lib/tableau/client";
import {
  groupViewsByProjectAndWorkbook,
  TableauCatalogGroup,
} from "@/lib/tableau/catalog";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { groups: TableauCatalogGroup[]; fetchedAt: number } | null = null;

export async function GET(request: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
  if (
    !forceRefresh &&
    cache &&
    Date.now() - cache.fetchedAt < CACHE_TTL_MS
  ) {
    return NextResponse.json({ groups: cache.groups, fetchedAt: cache.fetchedAt });
  }

  const client = TableauClient.fromEnv();
  try {
    await client.signIn();
    const views = await client.listViews();
    const groups = groupViewsByProjectAndWorkbook(views);
    cache = { groups, fetchedAt: Date.now() };
    return NextResponse.json({ groups, fetchedAt: cache.fetchedAt });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown Tableau catalog error";
    if (cache) {
      return NextResponse.json({
        groups: cache.groups,
        fetchedAt: cache.fetchedAt,
        stale: true,
        error: message,
      });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    await client.signOut().catch(() => {});
  }
}
