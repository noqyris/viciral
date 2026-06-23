import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * Shared cron auth: Bearer header or `?token=` must match CRON_SECRET. Returns an
 * error response to short-circuit, or null when the request may proceed.
 * Fail-closed in production when CRON_SECRET is unset; permissive in dev.
 */
export function denyCron(req: Request): NextResponse | null {
  const secret = env.CRON_SECRET;
  if (!secret) {
    if (env.NODE_ENV === "production") {
      return NextResponse.json({ error: "cron not configured" }, { status: 503 });
    }
    return null;
  }
  const auth = req.headers.get("authorization");
  const token = new URL(req.url).searchParams.get("token");
  if (auth !== `Bearer ${secret}` && token !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
