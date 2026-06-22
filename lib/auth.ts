import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

/**
 * Auth seam. The concrete provider (Clerk vs Auth.js) is an open decision in the
 * plan — for now this resolves a single dev user so the app runs end-to-end
 * locally. Wire a real provider before production: replace the body of
 * {@link getCurrentUser} to read the authenticated session.
 */
export async function getCurrentUser(): Promise<User> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Auth not configured. Wire Clerk or Auth.js into lib/auth.ts before production.",
    );
  }
  const email = "dev@viciral.local";
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Dev User" },
  });
}
