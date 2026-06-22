import crypto from "node:crypto";
import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { requireEnv } from "@/lib/env";

/**
 * Lemon Squeezy (Merchant of Record) integration. We keep the credit ledger as
 * our own source of truth; LS webhooks drive subscription state and credit
 * grants. Map each LS variant id to a plan + monthly credit allotment.
 */

let configured = false;
export function ensureLemonSqueezy() {
  if (configured) return;
  lemonSqueezySetup({ apiKey: requireEnv("LEMONSQUEEZY_API_KEY") });
  configured = true;
}

export interface PlanConfig {
  plan: string;
  monthlyCredits: number;
}

/**
 * Variant id → plan. Fill with real variant ids from the Lemon Squeezy
 * dashboard once products exist. Credit allotments are placeholders to tune
 * against the target blended margin before launch.
 */
export const PLAN_BY_VARIANT: Record<string, PlanConfig> = {
  // "123456": { plan: "starter", monthlyCredits: 2000 },
  // "123457": { plan: "pro", monthlyCredits: 6000 },
};

/** Verify a Lemon Squeezy webhook HMAC-SHA256 signature against the raw body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = requireEnv("LEMONSQUEEZY_WEBHOOK_SECRET");
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
