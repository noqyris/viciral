import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { listScheduled, schedulePost } from "@/lib/publishing/schedule";
import { jsonError, readJsonBody } from "@/lib/http";

export const runtime = "nodejs";

const createSchema = z.object({
  platform: z.string(),
  caption: z.string().min(1, "Tekst objave je obavezan").max(4000),
  mediaUrl: z.string().url().optional(),
  scheduledAt: z.string(),
  connectionId: z.string().optional(),
  generationId: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    const posts = await listScheduled(user.id);
    return NextResponse.json({ posts });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = createSchema.parse(await readJsonBody(req));
    const post = await schedulePost(user.id, {
      platform: body.platform,
      caption: body.caption,
      mediaUrl: body.mediaUrl,
      scheduledAt: new Date(body.scheduledAt),
      connectionId: body.connectionId,
      generationId: body.generationId,
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
