<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Viciral

AI content studio that aggregates multiple AI models (Claude, Nano Banana/Gemini, Seedance) so users can make social-media content, cinematic video, brand kits, and websites. Web-first (Next.js 16 App Router + TS + Tailwind 4), path to mobile later. Full product/architecture plan: `~/.claude/plans/hajde-da-napravimo-plan-magical-fog.md`.

## Architecture (5 core concepts)
- **Modules** (`lib/modules/`) — each module is an integrated multi-model workflow (the moat). `registry.ts` lists them; the hub/runner are generic over `ModuleDef`. Flagship: `social-pack.ts`. Add a module = add a definition.
- **Providers** (`lib/providers/`) — capability interfaces (text/image/video) backed by adapters (`anthropic.ts`, `fal.ts`). Lets a step be re-pointed if a provider's pricing/ToS changes (anti-lock-in).
- **Credits** (`lib/credits/`) — `pricing.ts` is the model catalog + margin math (retail = wholesale × margin; 1 credit = $0.01). `ledger.ts` is the append-only source of truth. Only commercial-licensed models are resold.
- **Jobs** (`lib/jobs/runner.ts`) — validates inputs, enforces credits, runs the module, persists assets, debits. Async video uses the fal queue + `app/api/webhooks/fal`.
- **Billing/storage** — Lemon Squeezy (MoR) drives subscription/credit grants via `app/api/webhooks/lemonsqueezy`; assets persist to Cloudflare R2 (`lib/storage/r2.ts`).

## Commands
- `pnpm dev` · `pnpm build` · `pnpm test` (vitest) · `pnpm lint` · `pnpm typecheck`
- `pnpm db:push` / `pnpm db:migrate` (needs `DATABASE_URL`)

## Conventions
- **Node 22 LTS recommended** (`nvm use 22`). Prisma is pinned to v6 (Prisma 7 needs Node ≥22.12 and broke on Node 21).
- Claude model IDs: orchestration `claude-opus-4-8`, bulk text `claude-sonnet-4-6` (see `lib/providers/anthropic.ts`). Confirm any Claude pricing/ID via the `claude-api` skill — don't answer from memory.
- Env access goes through `lib/env.ts` (`requireEnv` fails loudly only when a feature is used). Copy `.env.example` → `.env`.
- Auth is a dev stub in `lib/auth.ts` — wire Clerk/Auth.js before production (open decision).
- UI/user-facing copy is in Serbian.
