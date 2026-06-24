import { prisma } from "@/lib/db";
import { AppError } from "@/lib/http";
import { getPublishProvider } from "./providers";
import { isPlatform, type Platform } from "./types";

export interface ScheduleInput {
  platform: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: Date;
  connectionId?: string;
  generationId?: string;
}

/** Queues a post to publish at a time (content calendar). */
export async function schedulePost(userId: string, input: ScheduleInput) {
  if (!isPlatform(input.platform)) throw new AppError("Nepoznata platforma", 400);
  if (input.caption.trim().length === 0) throw new AppError("Tekst objave je obavezan", 400);
  if (Number.isNaN(input.scheduledAt.getTime())) throw new AppError("Neispravan datum", 400);
  if (input.mediaUrl && !/^https?:\/\//i.test(input.mediaUrl)) {
    throw new AppError("URL medija mora biti http(s).", 400);
  }

  // Validate the connection belongs to this user (clean 4xx, no cross-user FK).
  let connectionId: string | undefined;
  if (input.connectionId) {
    const conn = await prisma.socialConnection.findFirst({
      where: { id: input.connectionId, userId },
      select: { id: true },
    });
    if (!conn) throw new AppError("Nalog nije pronađen", 404);
    connectionId = conn.id;
  }

  // Same ownership check for the linked generation — the column has no FK, so an
  // unvalidated id would let a user attach another user's (or any) generation.
  let generationId: string | undefined;
  if (input.generationId) {
    const gen = await prisma.generation.findFirst({
      where: { id: input.generationId, userId },
      select: { id: true },
    });
    if (!gen) throw new AppError("Generacija nije pronađena", 404);
    generationId = gen.id;
  }

  return prisma.scheduledPost.create({
    data: {
      userId,
      platform: input.platform,
      caption: input.caption.slice(0, 4000),
      mediaUrl: input.mediaUrl,
      scheduledAt: input.scheduledAt,
      connectionId,
      generationId,
      status: "SCHEDULED",
    },
  });
}

export function listScheduled(userId: string) {
  return prisma.scheduledPost.findMany({
    where: { userId },
    orderBy: { scheduledAt: "asc" },
    take: 100,
  });
}

export async function cancelScheduled(userId: string, id: string) {
  // Atomic conditional cancel (mirrors runDuePosts' claim) so a concurrent cron
  // run flipping SCHEDULED→PUBLISHING can't be clobbered back to CANCELED.
  const res = await prisma.scheduledPost.updateMany({
    where: { id, userId, status: "SCHEDULED" },
    data: { status: "CANCELED" },
  });
  if (res.count === 0) {
    const existing = await prisma.scheduledPost.findFirst({
      where: { id, userId },
      select: { status: true },
    });
    if (!existing) throw new AppError("Objava nije pronađena", 404);
    throw new AppError("Samo zakazane objave mogu da se otkažu", 400);
  }
  return prisma.scheduledPost.findFirstOrThrow({ where: { id, userId } });
}

/**
 * Publishes posts whose time has come. Claims each row atomically
 * (SCHEDULED → PUBLISHING via conditional updateMany) so concurrent cron runs
 * can't double-publish. Until OAuth is wired, the provider stub fails with a
 * clear "connect your account" message and the post is marked FAILED.
 */
export async function runDuePosts(
  now: Date = new Date(),
): Promise<{ processed: number; published: number; failed: number }> {
  const due = await prisma.scheduledPost.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    take: 50,
  });

  let published = 0;
  let failed = 0;

  for (const post of due) {
    // Atomic claim — only the run that flips SCHEDULED→PUBLISHING proceeds.
    const claim = await prisma.scheduledPost.updateMany({
      where: { id: post.id, status: "SCHEDULED" },
      data: { status: "PUBLISHING" },
    });
    if (claim.count === 0) continue;

    try {
      const connection = post.connectionId
        ? await prisma.socialConnection.findFirst({
            where: { id: post.connectionId, userId: post.userId },
          })
        : await prisma.socialConnection.findFirst({
            where: { userId: post.userId, platform: post.platform, status: "connected" },
          });

      if (!connection?.accessToken) {
        throw new Error("Nalog nije povezan — poveži nalog da bi objava izašla.");
      }

      const provider = getPublishProvider(post.platform as Platform);
      const result = await provider.publish({
        caption: post.caption,
        mediaUrl: post.mediaUrl ?? undefined,
        accessToken: connection.accessToken,
        externalAccountId: connection.externalId ?? undefined,
      });

      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHED", externalId: result.externalId, error: null },
      });
      published++;
    } catch (err) {
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: "FAILED", error: (err as Error).message },
      });
      failed++;
    }
  }

  return { processed: due.length, published, failed };
}
