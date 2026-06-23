import { NextResponse } from "next/server";
import { denyCron } from "@/lib/cron/guard";
import { reapStuckJobs } from "@/lib/jobs/reaper";

export const runtime = "nodejs";

/** Cron endpoint that sweeps stuck async jobs. Auth via CRON_SECRET. */
async function handle(req: Request) {
  const denied = denyCron(req);
  if (denied) return denied;
  const result = await reapStuckJobs();
  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
