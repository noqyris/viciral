import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { settleVideoJob } from "@/lib/jobs/settle";

export const runtime = "nodejs";

/**
 * fal.ai queue webhook — called when an async job (e.g. Seedance video) finishes.
 * Fail-closed: a request without a valid token is rejected, and an unset
 * FAL_WEBHOOK_SECRET in production is a hard configuration error (never an open
 * endpoint). Settlement is idempotent (lib/jobs/settle.ts), so fal retries are safe.
 *
 * TODO: upgrade the shared-token guard to fal's ED25519 webhook signature
 * verification before launch.
 */
export async function POST(req: Request) {
  const secret = env.FAL_WEBHOOK_SECRET;
  if (!secret) {
    if (env.NODE_ENV === "production") {
      return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
    }
    // Dev only: allow unauthenticated so local testing works without a secret.
  } else {
    const token = new URL(req.url).searchParams.get("token");
    if (token !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: {
    request_id?: string;
    status?: string;
    payload?: { video?: { url?: string; width?: number; height?: number } };
    error?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const requestId = payload.request_id;
  if (!requestId) {
    return NextResponse.json({ error: "missing request_id" }, { status: 400 });
  }

  const failed = payload.status === "ERROR" || payload.error != null;
  const video = payload.payload?.video;

  const result = await settleVideoJob(requestId, {
    status: failed || !video?.url ? "failed" : "completed",
    videoUrl: video?.url,
    width: video?.width,
    height: video?.height,
    error: failed ? "Provider je prijavio grešku" : undefined,
  });

  return NextResponse.json(result);
}
