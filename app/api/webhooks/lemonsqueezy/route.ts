import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { grantCredits } from "@/lib/credits/ledger";
import { PLAN_BY_VARIANT, verifyWebhookSignature } from "@/lib/billing/lemonsqueezy";

export const runtime = "nodejs";

/**
 * Lemon Squeezy webhook. Verifies the HMAC signature against the raw body, then
 * on subscription events grants the plan's monthly credits and upserts the
 * subscription record. The credit ledger remains our source of truth.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  let valid = false;
  try {
    valid = verifyWebhookSignature(raw, signature);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
  if (!valid) {
    return NextResponse.json({ error: "Nevažeći potpis" }, { status: 401 });
  }

  // Minimal payload shape we rely on (see Lemon Squeezy webhook docs).
  const payload = JSON.parse(raw) as {
    meta?: { event_name?: string; custom_data?: { user_id?: string } };
    data?: {
      id?: string;
      attributes?: {
        variant_id?: number | string;
        customer_id?: number | string;
        status?: string;
        renews_at?: string | null;
      };
    };
  };

  const eventName = payload.meta?.event_name ?? "";
  const userId = payload.meta?.custom_data?.user_id;
  const attrs = payload.data?.attributes;
  const variantId = attrs?.variant_id != null ? String(attrs.variant_id) : undefined;

  // We only need a user id (passed as checkout custom_data) to attribute credits.
  if (!userId || !variantId) {
    return NextResponse.json({ received: true, skipped: "missing user/variant" });
  }

  const planConfig = PLAN_BY_VARIANT[variantId];

  if (eventName === "subscription_created" || eventName === "subscription_updated") {
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        lsSubscriptionId: payload.data?.id,
        lsCustomerId: attrs?.customer_id != null ? String(attrs.customer_id) : undefined,
        variantId,
        plan: planConfig?.plan ?? "free",
        status: attrs?.status ?? "active",
        monthlyCredits: planConfig?.monthlyCredits ?? 0,
        renewsAt: attrs?.renews_at ? new Date(attrs.renews_at) : null,
      },
      create: {
        userId,
        lsSubscriptionId: payload.data?.id,
        lsCustomerId: attrs?.customer_id != null ? String(attrs.customer_id) : undefined,
        variantId,
        plan: planConfig?.plan ?? "free",
        status: attrs?.status ?? "active",
        monthlyCredits: planConfig?.monthlyCredits ?? 0,
        renewsAt: attrs?.renews_at ? new Date(attrs.renews_at) : null,
      },
    });
  }

  // Grant monthly credits when a subscription is created or renews. The grant is
  // idempotent on (event, data id): Lemon Squeezy delivers at-least-once and
  // retries on non-2xx, and for payment_success `data.id` is the per-payment
  // invoice id, so each renewal grants exactly once and retries are no-ops.
  if (
    planConfig &&
    (eventName === "subscription_created" || eventName === "subscription_payment_success")
  ) {
    const idempotencyKey = `ls:${eventName}:${payload.data?.id ?? ""}`;
    await grantCredits(
      userId,
      planConfig.monthlyCredits,
      `lemonsqueezy:${eventName}`,
      payload.data?.id,
      idempotencyKey,
    );
  }

  return NextResponse.json({ received: true });
}
