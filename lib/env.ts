import { z } from "zod";

/**
 * Centralized, typed environment access.
 *
 * Almost everything is optional so that `next build` and local dev never crash
 * on a missing key. Integrations call {@link requireEnv} at the point of use, so
 * a missing key fails loudly only when that specific feature is exercised.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().default("http://localhost:3000"),

  // Database (Postgres)
  DATABASE_URL: z.string().optional(),

  // AI providers
  ANTHROPIC_API_KEY: z.string().optional(),
  FAL_KEY: z.string().optional(),
  FAL_WEBHOOK_SECRET: z.string().optional(),

  // Reaper cron auth (sweeps stuck async jobs)
  CRON_SECRET: z.string().optional(),

  // Billing — Lemon Squeezy (Merchant of Record)
  LEMONSQUEEZY_API_KEY: z.string().optional(),
  LEMONSQUEEZY_STORE_ID: z.string().optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),

  // Object storage — Cloudflare R2 (S3-compatible)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

export const env = schema.parse(process.env);

export type Env = typeof env;

/** Returns the value of an env var or throws a clear error if it is missing. */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Missing required environment variable: ${String(key)}. Add it to .env (see .env.example).`,
    );
  }
  return value as NonNullable<Env[K]>;
}
