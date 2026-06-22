import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBalance } from "@/lib/credits/ledger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const balance = await getBalance(user.id);
    return NextResponse.json({ balance });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
