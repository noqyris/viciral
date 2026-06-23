import { falWebhookUrl } from "@/lib/jobs/webhook-url";
import type { UsageParams } from "@/lib/credits/pricing";
import type { VideoRequest } from "@/lib/providers/types";
import type { ModuleContext, SubmitResult } from "./types";

/**
 * Shared async-video submit (cinematic / avatar / dubbing). Forwards a module's
 * fields to the video provider with the fal webhook, and returns the SubmitResult
 * carrying the stable settlement `params` the webhook re-derives the charge from
 * — keeping reserve == settle in one place.
 */
export function submitVideoJob(
  ctx: Pick<ModuleContext<unknown>, "providers">,
  modelId: string,
  req: Omit<VideoRequest, "modelId" | "webhookUrl">,
  params: UsageParams,
): Promise<SubmitResult> {
  return ctx.providers.video
    .submitVideo({ modelId, ...req, webhookUrl: falWebhookUrl() })
    .then((res) => ({ requestId: res.requestId, modelId, params }));
}
