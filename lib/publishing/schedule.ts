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

  return prisma.scheduledPost.create({
    data: {
      userId,
      platform: input.platform,
      caption: input.caption.slice(0, 4000),
      mediaUrl: input.mediaUrl,
      scheduledAt: input.scheduledAt,
      connectionId,
      generationId: input.generationId,
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
  const post = await prisma.scheduledPost.findFirst({ where: { id, userId } });
  if (!post) throw new AppError("Objava nije pronađena", 404);
  if (post.status !== "SCHEDULED") {
    throw new AppError("Samo zakazane objave mogu da se otkažu", 400);
  }
  return prisma.scheduledPost.update({ where: { id }, data: { status: "CANCELED" } });
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
