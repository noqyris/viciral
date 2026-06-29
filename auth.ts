import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { grantSignupTrial } from "@/lib/auth-trial";
import { ensureUserHasOrg } from "@/lib/org";

/** Google is only wired when its OAuth keys are present (email+password always works). */
export const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials requires JWT sessions; OAuth users are still persisted via the adapter.
  session: { strategy: "jwt" },
  trustHost: true,
  secret: env.AUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "Email",
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  events: {
    // OAuth (Google) signups are created by the adapter — give them the same trial.
    async createUser({ user }) {
      if (user.id) {
        await grantSignupTrial(user.id);
        await ensureUserHasOrg(user.id);
      }
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) (token as { uid?: string }).uid = user.id;
      return token;
    },
    session({ session, token }) {
      const uid = (token as { uid?: string }).uid;
      if (uid && session.user) (session.user as { id?: string }).id = uid;
      return session;
    },
  },
});
