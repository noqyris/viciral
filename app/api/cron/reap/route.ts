import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { reapStuckJobs } from "@/lib/jobs/reaper";

export const runtime = "nodejs";

/**
 * Cron endpoint that sweeps stuck async jobs. Auth via CRON_SECRET (Bearer header
 * or ?token=). Fail-closed in production when CRON_SECRET is unset.
 */
async function handle(req: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) {
    if (env.NODE_ENV === "production") {
      return NextResponse.json({ error: "cron not configured" }, { status: 503 });
    }
  } else {
    const auth = req.headers.get("authorization");
    const token = new URL(req.url).searchParams.get("token");
    if (auth !== `Bearer ${secret}` && token !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const result = await reapStuckJobs();
  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
