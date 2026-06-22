import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env, requireEnv } from "@/lib/env";

/**
 * Cloudflare R2 (S3-compatible) storage. Providers return temporary URLs; we
 * download and persist assets to R2 so they outlive the provider's TTL.
 */

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

/** Download a provider asset by URL and persist it to R2 under `key`. Returns the public URL. */
export async function persistFromUrl(sourceUrl: string, key: string): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) for ${sourceUrl}`);
  const body = Buffer.from(await res.arrayBuffer());

  await getClient().send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET"),
      Key: key,
      Body: body,
      ContentType: res.headers.get("content-type") ?? "application/octet-stream",
    }),
  );

  const base = (env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  return `${base}/${key}`;
}
