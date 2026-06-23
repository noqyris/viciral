import { z } from "zod";
import { avatarScriptSeconds, estimateModuleCredits } from "@/lib/credits/estimate";
import { submitVideoJob } from "./async-video";
import type { ModuleDef } from "./types";

/**
 * Avatar / Presenter — async module. A portrait + a script → a talking-head
 * video where the person speaks the script (TTS + lip-sync), via a fal model.
 * Submits a queued job; the fal webhook settles credits and persists the clip
 * (lib/jobs/settle.ts, generic over the async video model). Premium / gated.
 */

export const AVATAR_VOICES = [
  { id: "f1", label: "Ženski — topao" },
  { id: "f2", label: "Ženski — energičan" },
  { id: "m1", label: "Muški — smiren" },
  { id: "m2", label: "Muški — dubok" },
] as const;

const VOICE_IDS = AVATAR_VOICES.map((v) => v.id) as [string, ...string[]];

const inputSchema = z.object({
  imageUrl: z.string().url("Potrebna je URL slike (portret / avatar)"),
  script: z.string().min(2, "Skripta je obavezna").max(1500),
  voiceId: z.enum(VOICE_IDS).default("f1"),
});

type Input = z.infer<typeof inputSchema>;

export const avatarModule: ModuleDef<Input> = {
  slug: "avatar",
  name: "Avatar / Presenter",
  tagline: "Portret + skripta → video u kom osoba izgovara tekst (lip-sync).",
  category: "video",
  status: "available",
  kind: "async",
  supportsAuto: false,
  icon: "🗣️",
  inputSchema,

  estimateCredits(input) {
    return estimateModuleCredits("avatar", input as Record<string, unknown>);
  },

  async submit(ctx) {
    const durationSec = avatarScriptSeconds(ctx.inputs.script);
    return submitVideoJob(
      ctx,
      "talking-avatar",
      {
        imageUrl: ctx.inputs.imageUrl,
        script: ctx.inputs.script,
        voiceId: ctx.inputs.voiceId,
        durationSec,
      },
      // Stable settlement basis: the webhook re-derives the same charge.
      { durationSec },
    );
  },
};
