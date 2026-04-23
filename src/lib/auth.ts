import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/server/audit";

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

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "6-digit code", type: "text" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, totp } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;
        if (user.status !== "ACTIVE") return null;

        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (!passwordOk) return null;

        if (user.mfaEnabled) {
          if (!user.mfaSecret || !totp) return null;
          const totpOk = authenticator.check(totp.trim(), user.mfaSecret);
          if (!totpOk) return null;
        }

        return {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          forcePasswordChange: user.forcePasswordChange,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.isAdmin = Boolean(user.isAdmin);
        token.forcePasswordChange = Boolean(user.forcePasswordChange);
      } else if (typeof token.userId === "string") {
        const fresh = await prisma.user.findUnique({
          where: { id: token.userId },
          select: { isAdmin: true, forcePasswordChange: true, status: true },
        });
        if (!fresh || fresh.status !== "ACTIVE") {
          return { ...token, userId: undefined };
        }
        token.isAdmin = fresh.isAdmin;
        token.forcePasswordChange = fresh.forcePasswordChange;
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
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      await logAuditEvent({ userId: user.id, action: "login" });
    },
  },
});
