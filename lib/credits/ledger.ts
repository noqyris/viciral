import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Credits are tracked on `User.creditBalance` (the authoritative counter) and
 * mirrored to the append-only `CreditLedger` (audit log). All mutations are
 * atomic at the row level, so concurrent debits cannot overspend.
 */

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly balance: number,
    public readonly required: number,
  ) {
    super(`Nedovoljno kredita: imaš ${balance}, potrebno ${required}`);
    this.name = "InsufficientCreditsError";
  }
}

type AddType = "GRANT" | "REFUND" | "ADJUSTMENT";

export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });
  return user?.creditBalance ?? 0;
}

/**
 * Adds credits and records a ledger row in one transaction. When
 * `idempotencyKey` is set, a repeated call (e.g. a retried webhook) is a no-op:
 * the unique constraint serializes concurrent duplicates.
 */
async function addCredits(
  userId: string,
  amount: number,
  type: AddType,
  reason: string,
  refId?: string,
  idempotencyKey?: string,
  organizationId?: string,
) {
  if (amount <= 0) throw new Error("amount must be positive");
  try {
    return await prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        const existing = await tx.creditLedger.findUnique({ where: { idempotencyKey } });
        if (existing) return existing; // already processed
      }
      const user = await tx.user.update({
        where: { id: userId },
        data: { creditBalance: { increment: amount } },
      });
      return tx.creditLedger.create({
        data: {
          userId,
          organizationId,
          type,
          amount,
          balanceAfter: user.creditBalance,
          reason,
          refId,
          idempotencyKey,
        },
      });
    });
  } catch (err) {
    // Concurrent duplicate hit the unique constraint — treat as already-processed.
    if (
      idempotencyKey &&
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return prisma.creditLedger.findUnique({ where: { idempotencyKey } });
    }
    throw err;
  }
}

/** Add subscription/top-up credits (idempotent when `idempotencyKey` is given). */
export function grantCredits(
  userId: string,
  amount: number,
  reason: string,
  refId?: string,
  idempotencyKey?: string,
) {
  return addCredits(userId, amount, "GRANT", reason, refId, idempotencyKey);
}

/**
 * Return reserved-but-unused credits (or refund a failed run). Pass an
 * `idempotencyKey` so a late webhook and a reaper can't both refund the same
 * reservation.
 */
export function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  refId?: string,
  idempotencyKey?: string,
  organizationId?: string,
) {
  return addCredits(userId, amount, "REFUND", reason, refId, idempotencyKey, organizationId);
}

/**
 * Atomically consume credits. The conditional `updateMany` (decrement only when
 * `creditBalance >= amount`) takes a row lock, so two concurrent debits cannot
 * both succeed past the balance. Throws {@link InsufficientCreditsError}.
 */
export async function debitCredits(
  userId: string,
  amount: number,
  reason: string,
  refId?: string,
  organizationId?: string,
) {
  if (amount <= 0) throw new Error("debit amount must be positive");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: userId, creditBalance: { gte: amount } },
      data: { creditBalance: { decrement: amount } },
    });
    if (updated.count === 0) {
      const balance =
        (await tx.user.findUnique({ where: { id: userId }, select: { creditBalance: true } }))
          ?.creditBalance ?? 0;
      throw new InsufficientCreditsError(balance, amount);
    }
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { creditBalance: true },
    });
    return tx.creditLedger.create({
      data: {
        userId,
        organizationId,
        type: "DEBIT",
        amount: -amount,
        balanceAfter: user.creditBalance,
        reason,
        refId,
      },
    });
  });
}
