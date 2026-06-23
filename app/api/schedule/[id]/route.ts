import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelScheduled } from "@/lib/publishing/schedule";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const post = await cancelScheduled(user.id, id);
    return NextResponse.json({ post });
  } catch (err) {
    return jsonError(err);
  }
}
