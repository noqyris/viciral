import { prisma } from "@/lib/db";

/**
 * Append-only credit ledger. Balance = sum of signed amounts.
 * GRANT/REFUND/positive ADJUSTMENT add; DEBIT subtracts (stored negative).
 */

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly balance: number,
    public readonly required: number,
  ) {
    super(`Insufficient credits: have ${balance}, need ${required}`);
    this.name = "InsufficientCreditsError";
  }
}

export async function getBalance(userId: string): Promise<number> {
  const agg = await prisma.creditLedger.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

/** Add credits (subscription grant or top-up). */
export async function grantCredits(
  userId: string,
  amount: number,
  reason: string,
  refId?: string,
) {
  if (amount <= 0) throw new Error("grant amount must be positive");
  return prisma.$transaction(async (tx) => {
    const cur = await tx.creditLedger.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const balanceAfter = (cur._sum.amount ?? 0) + amount;
    return tx.creditLedger.create({
      data: { userId, type: "GRANT", amount, balanceAfter, reason, refId },
    });
  });
}

/** Consume credits, enforcing a sufficient balance. Throws {@link InsufficientCreditsError}. */
export async function debitCredits(
  userId: string,
  amount: number,
  reason: string,
  refId?: string,
) {
  if (amount <= 0) throw new Error("debit amount must be positive");
  return prisma.$transaction(async (tx) => {
    const cur = await tx.creditLedger.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    const balance = cur._sum.amount ?? 0;
    if (balance < amount) throw new InsufficientCreditsError(balance, amount);
    const balanceAfter = balance - amount;
    return tx.creditLedger.create({
      data: { userId, type: "DEBIT", amount: -amount, balanceAfter, reason, refId },
    });
  });
}
