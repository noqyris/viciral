import { NextResponse } from "next/server";
import { denyCron } from "@/lib/cron/guard";
import { runDuePosts } from "@/lib/publishing/schedule";

export const runtime = "nodejs";

/** Cron endpoint that publishes due scheduled posts. Auth via CRON_SECRET. */
async function handle(req: Request) {
  const denied = denyCron(req);
  if (denied) return denied;
  const result = await runDuePosts();
  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
