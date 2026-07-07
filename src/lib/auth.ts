import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/server/audit";
import { authConfig } from "@/lib/auth.config";

const ALLOWED_DOMAIN = "progressiveproperty.co.uk";

// Always granted admin on first sign-in, even against a brand-new database,
// so there's never a chicken-and-egg problem getting an initial admin set up.
const BOOTSTRAP_ADMIN_EMAILS = new Set(["sfadmin@progressiveproperty.co.uk"]);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: { hd: ALLOWED_DOMAIN, prompt: "select_account" },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      const hd = typeof profile?.hd === "string" ? profile.hd : undefined;
      if (hd !== ALLOWED_DOMAIN && !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        return false;
      }

      let dbUser = await prisma.user.findUnique({ where: { email } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name ?? null,
            isAdmin: BOOTSTRAP_ADMIN_EMAILS.has(email),
            status: "ACTIVE",
          },
        });
      }
      if (dbUser.status !== "ACTIVE") return false;

      // Overwrite Google's provider-scoped id with our internal user id so it
      // flows through to the jwt callback and events.signIn below.
      user.id = dbUser.id;
      user.isAdmin = dbUser.isAdmin;
      user.name = dbUser.name;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.isAdmin = Boolean(user.isAdmin);
        token.displayName = user.name ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.userId === "string") {
        session.user.id = token.userId;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.name =
          typeof token.displayName === "string" ? token.displayName : null;
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
