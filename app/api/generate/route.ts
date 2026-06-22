import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { runModule } from "@/lib/jobs/runner";
import type { GenerationMode } from "@/lib/modules/types";

export const runtime = "nodejs";

interface GenerateBody {
  moduleSlug?: string;
  mode?: GenerationMode;
  inputs?: unknown;
  brandId?: string;
}

export async function POST(req: Request) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Nevažeći JSON" }, { status: 400 });
  }

  if (!body.moduleSlug) {
    return NextResponse.json({ error: "moduleSlug je obavezan" }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const generation = await runModule({
      userId: user.id,
      moduleSlug: body.moduleSlug,
      mode: body.mode === "auto" ? "auto" : "manual",
      inputs: body.inputs ?? {},
      brandId: body.brandId,
    });
    return NextResponse.json({ generation });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Nevažeći ulazi", issues: err.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
