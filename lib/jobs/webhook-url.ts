import { env } from "@/lib/env";

/**
 * Where fal posts the job-complete webhook for async jobs. A shared token guards
 * the endpoint (see app/api/webhooks/fal). Returns undefined when APP_URL is not
 * set (local dev without a tunnel) — the reaper then backstops completion.
 */
export function falWebhookUrl(): string | undefined {
  const base = env.APP_URL?.replace(/\/$/, "");
  if (!base) return undefined;
  const url = `${base}/api/webhooks/fal`;
  return env.FAL_WEBHOOK_SECRET
    ? `${url}?token=${encodeURIComponent(env.FAL_WEBHOOK_SECRET)}`
    : url;
}
