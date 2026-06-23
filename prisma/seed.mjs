import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Dev seed: a ready-to-use local account with credits so you can sign in and
 * click through generations. Idempotent — re-running never double-grants
 * (guarded by a CreditLedger idempotency key).
 *
 *   pnpm db:seed
 *
 * Login:  dev@viciral.local  /  dev12345
 */
const prisma = new PrismaClient();

const EMAIL = "dev@viciral.local";
const PASSWORD = "dev12345";
const CREDITS = 5000;
const KEY = "dev-seed-grant";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash },
    create: { email: EMAIL, name: "Dev User", passwordHash },
  });

  const existing = await prisma.creditLedger.findUnique({ where: { idempotencyKey: KEY } });
  if (existing) {
    console.log(`✓ ${EMAIL} already seeded — balance ${user.creditBalance} credits.`);
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { creditBalance: { increment: CREDITS } },
    }),
    prisma.creditLedger.create({
      data: {
        userId: user.id,
        type: "GRANT",
        amount: CREDITS,
        balanceAfter: user.creditBalance + CREDITS,
        reason: "dev seed",
        idempotencyKey: KEY,
      },
    }),
  ]);
  console.log(`✓ Granted ${CREDITS} credits to ${EMAIL}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
