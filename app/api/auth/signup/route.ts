import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { AppError, jsonError, readJsonBody } from "@/lib/http";
import { grantSignupTrial } from "@/lib/auth-trial";
import { ensureUserHasOrg } from "@/lib/org";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Neispravan email"),
  password: z.string().min(8, "Lozinka mora imati bar 8 znakova").max(200),
  name: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const { email, password, name } = schema.parse(await readJsonBody(req));
    const normEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing) throw new AppError("Nalog sa ovim emailom već postoji.", 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: normEmail, name: name?.trim() || null, passwordHash },
    });
    await grantSignupTrial(user.id);
    await ensureUserHasOrg(user.id);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
