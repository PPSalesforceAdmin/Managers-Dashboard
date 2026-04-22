import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TableauClient } from "@/lib/tableau/client";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const client = TableauClient.fromEnv();
  try {
    await client.signIn();
    await client.signOut();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown Tableau ping error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
