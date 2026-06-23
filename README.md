# Viciral

AI content studio that aggregates multiple AI models (Claude, Nano Banana/Gemini, Seedance, and more via fal.ai) so anyone can make social-media content, cinematic video, brand kits, websites, talking-head avatars, dubbed video, music, and more — from a single studio.

Web-first: **Next.js 16 (App Router) + TypeScript + Tailwind 4 + Prisma 6 + Postgres**. See [AGENTS.md](AGENTS.md) for architecture and conventions.

## Modules

Hub at `/studio` → pick a module. Each is an integrated multi-model workflow with a manual mode and an opt-in **Auto** mode (Claude orchestrates the whole pipeline).

Social Pack · Cinematic Video · Brand Kit · Website Builder · Image Tools (bg-remove / upscale / reframe) · Short-Form Clips · Image Editor · Avatar / Presenter · Dubbing / Localization · Music.

Plus: **Recepti** (quick-start templates), **Kalendar** (schedule posts), **Brendovi** (brand memory with character references).

## Run it locally

### 1) Just the UI shell (no database)

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Renders without a DB: landing, `/studio` (hub), `/studio/templates`, `/studio/connections`. DB-backed pages (history, brand, calendar) and running a module need a database — see below.

### 2) Full click-through (database, recommended)

1. Provision Postgres (local, Docker, or a free **Neon** / **Supabase** instance).
2. `cp .env.example .env` and set `DATABASE_URL=...`
3. Create tables and seed a dev user with credits:
   ```bash
   pnpm db:push
   pnpm db:seed     # grants 5000 credits to dev@viciral.local (idempotent)
   pnpm dev
   ```

Now every page works. Running a module goes through the full flow and **reserves credits**, then fails at the provider call until you add AI keys (step 3) — so you can exercise the whole UX without real output.

> Auth is **Auth.js (NextAuth)** — email+password and (optional) Google. `pnpm db:seed` creates a ready dev login: **`dev@viciral.local` / `dev12345`** (5000 credits). New signups get 200 trial credits. Set `AUTH_SECRET` in `.env` (any random string); set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` to enable the Google button (redirect URI `http://localhost:3000/api/auth/callback/google`).

### 3) Real generation (add AI keys)

Add to `.env`:

```
ANTHROPIC_API_KEY=...
FAL_KEY=...
APP_URL=http://localhost:3000
```

- **Sync modules** work fully locally: Social Pack, Brand Kit, Website, Image Tools, Short-Form (plan), Editor, Music.
- **Async modules** (Cinematic, Avatar, Dubbing) settle via a fal **webhook** that can't reach `localhost`. Either run a tunnel (`ngrok http 3000` → put its URL in `APP_URL`), or manually trigger the backstop: open `http://localhost:3000/api/cron/reap`.

> Several new fal models are wired behind the provider abstraction with **placeholder endpoints/prices** (clearly commented in [lib/credits/pricing.ts](lib/credits/pricing.ts)): whisper, bg-removal, upscale, nano-banana-edit, talking-avatar, video-dub, music-gen, recraft-vector. Confirm each model id, price and commercial license on fal before real use. Stable models (Nano Banana, Claude) work as-is.

## Commands

| | |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm test` | Vitest |
| `pnpm lint` · `pnpm typecheck` | ESLint · tsc |
| `pnpm db:push` · `pnpm db:migrate` · `pnpm db:seed` | Prisma (needs `DATABASE_URL`) |

## Status

MVP under active build. Publishing (calendar + cron) is scaffolded; it goes live once Auth.js + platform OAuth apps (Meta / TikTok / LinkedIn) are wired with keys. UI copy is in Serbian.
