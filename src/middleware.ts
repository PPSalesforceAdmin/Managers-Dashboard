import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Edge-runtime middleware: uses the edge-safe auth config only (no Prisma).
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PREFIXES = ["/api/auth"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isAuthed = Boolean(req.auth?.user?.id);

  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAuthed && !isPublicPath) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  if (isAuthed) {
    const forceChange = Boolean(req.auth?.user?.forcePasswordChange);
    const onChangeRoute =
      pathname === "/change-password" || pathname === "/api/account/password";
    if (forceChange && !onChangeRoute && !isPublicPath) {
      return NextResponse.redirect(new URL("/change-password", req.nextUrl));
    }

    const adminPath =
      pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
    if (adminPath && !req.auth?.user?.isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
