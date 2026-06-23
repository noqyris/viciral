import { prisma } from "@/lib/db";

/** Free credits granted to every new account (email or Google) so they can try it. */
export const TRIAL_CREDITS = 200;

/**
 * Grants the signup trial credits once per user (idempotent via the ledger's
 * unique `signup:<id>` key). Called from the signup API (email) and the Auth.js
 * createUser event (Google), so both paths get the same trial.
 */
export async function grantSignupTrial(userId: string): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { creditBalance: { increment: TRIAL_CREDITS } },
      }),
      prisma.creditLedger.create({
        data: {
          userId,
          type: "GRANT",
          amount: TRIAL_CREDITS,
          balanceAfter: TRIAL_CREDITS,
          reason: "signup-trial",
          idempotencyKey: `signup:${userId}`,
        },
      }),
    ]);
  } catch (err) {
    // Already granted (unique idempotencyKey) — ignore.
    if ((err as { code?: string }).code !== "P2002") throw err;
  }
}
