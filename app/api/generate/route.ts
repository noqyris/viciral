import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runModule } from "@/lib/jobs/runner";
import { getActiveOrg } from "@/lib/active-org";
import { AppError, jsonError, readJsonBody } from "@/lib/http";
import type { GenerationMode } from "@/lib/modules/types";

export const runtime = "nodejs";

interface GenerateBody {
  moduleSlug?: string;
  mode?: GenerationMode;
  inputs?: unknown;
  brandId?: string;
}

export async function POST(req: Request) {
  try {
    const body = await readJsonBody<GenerateBody>(req);

    if (!body.moduleSlug) throw new AppError("moduleSlug je obavezan", 400);

    const user = await getCurrentUser();
    const org = await getActiveOrg(user.id);
    const generation = await runModule({
      userId: user.id,
      organizationId: org.id,
      moduleSlug: body.moduleSlug,
      mode: body.mode === "auto" ? "auto" : "manual",
      inputs: body.inputs ?? {},
      brandId: body.brandId,
    });
    return NextResponse.json({ generation });
  } catch (err) {
    return jsonError(err);
  }
}
