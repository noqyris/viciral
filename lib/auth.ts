import type { User } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/http";

/**
 * The authenticated user for the current request (Auth.js session → DB user).
 * Throws 401 if not signed in. Studio pages guard with a redirect; API routes
 * surface the 401 to the client.
 */
export async function getCurrentUser(): Promise<User> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new AppError("Niste prijavljeni.", 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("Korisnik nije pronađen.", 401);
  return user;
}
