import type { NextAuthConfig, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      isAdmin: boolean;
      forcePasswordChange: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    id?: string;
    isAdmin?: boolean;
    forcePasswordChange?: boolean;
  }
}

// Edge-safe config: no Prisma imports, no Node-only modules.
// Middleware (which runs on the Edge runtime) imports this file directly.
// Providers are added by src/lib/auth.ts.
export const authConfig = {
  debug: process.env.AUTH_DEBUG === "true",
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60,
    updateAge: 5 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.isAdmin = Boolean(user.isAdmin);
        token.forcePasswordChange = Boolean(user.forcePasswordChange);
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.userId === "string") {
        session.user.id = token.userId;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.forcePasswordChange = Boolean(token.forcePasswordChange);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
