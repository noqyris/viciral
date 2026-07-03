import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { InsufficientCreditsError } from "@/lib/credits/ledger";

/** True for a non-empty http(s) URL string (does not trim — trim at the call site). */
export const isHttpUrl = (s: unknown): s is string =>
  typeof s === "string" && /^https?:\/\//i.test(s);

/** A user-safe, intentional error whose message may be shown to the client. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Parses a JSON request body, mapping malformed JSON to a clean 400 instead of
 * letting the SyntaxError fall through {@link jsonError} as a generic 500.
 */
export async function readJsonBody<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new AppError("Nevažeći JSON", 400);
  }
}

/**
 * Maps an error to a JSON response. Intentional/domain errors surface their
 * message; anything unexpected is logged server-side and returned as a generic
 * 500 so internal details (Prisma, env, file paths) never leak to clients.
 */
export function jsonError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Nevažeći ulazi", issues: err.issues }, { status: 400 });
  }
  if (err instanceof InsufficientCreditsError) {
    return NextResponse.json({ error: err.message }, { status: 402 });
  }
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("Unhandled API error:", err);
  return NextResponse.json({ error: "Interna greška" }, { status: 500 });
}
