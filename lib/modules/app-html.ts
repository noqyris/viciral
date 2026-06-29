/**
 * Pure, deterministic APP-HTML assembly (mirrors website-html.ts). The model only
 * supplies a structured spec (screens, labels, block types from a FIXED enum,
 * text). We author all markup + the screen-switching script ourselves and
 * HTML-escape every model string — so untrusted content can't inject markup or
 * script. The accent color is strictly validated. Output is a single
 * self-contained, downloadable index.html (an interactive multi-screen SPA shell).
 */
import { escapeHtml } from "@/lib/html";

export type AppBlockType = "text" | "feature-list" | "cta" | "stat-grid" | "gallery";

export interface AppBlock {
  type: AppBlockType;
  heading?: string;
  body?: string;
  items?: string[];
}

export interface AppScreen {
  id: string;
  label: string;
  heading: string;
  subheading?: string;
  blocks: AppBlock[];
  imageUrl?: string;
}

export interface AppSpec {
  title: string;
  accent: string;
  screens: AppScreen[];
}

function sanitizeAccent(accent: string, fallback = "#7c3aed"): string {
  const v = (accent || "").trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback;
}

function safeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : undefined;
}

function screenId(s: string, i: number): string {
  const id = (s || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  return id || `screen-${i}`;
}

export function buildAppHtml(spec: AppSpec): string {
  const accent = sanitizeAccent(spec.accent);
  const title = escapeHtml(spec.title || "App");
  const screens = spec.screens.slice(0, 6);

  const ids = screens.map((s, i) => screenId(s.id, i));

  const renderBlock = (b: AppBlock): string => {
    const h = b.heading ? `<h3 class="text-lg font-semibold tracking-tight">${escapeHtml(b.heading)}</h3>` : "";
    const items = (b.items ?? []).slice(0, 8).map((it) => escapeHtml(it));
    switch (b.type) {
      case "text":
        return `<div class="space-y-2">${h}<p class="whitespace-pre-line text-zinc-600">${escapeHtml(b.body ?? "")}</p></div>`;
      case "feature-list":
        return `<div class="space-y-3">${h}<ul class="space-y-2">${items
          .map((it) => `<li class="flex items-start gap-2"><span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style="background:${accent}"></span><span class="text-zinc-600">${it}</span></li>`)
          .join("")}</ul></div>`;
      case "cta":
        return `<div class="rounded-2xl px-6 py-10 text-center text-white" style="background:${accent}">${
          b.heading ? `<h3 class="text-2xl font-bold">${escapeHtml(b.heading)}</h3>` : ""
        }${b.body ? `<p class="mx-auto mt-2 max-w-md opacity-90">${escapeHtml(b.body)}</p>` : ""}<button class="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold" style="color:${accent}">${escapeHtml(items[0] ?? "OK")}</button></div>`;
      case "stat-grid":
        return `<div class="space-y-3">${h}<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">${items
          .map((it) => `<div class="rounded-xl border border-zinc-200 p-4 text-center"><div class="text-sm font-medium text-zinc-700">${it}</div></div>`)
          .join("")}</div></div>`;
      case "gallery":
        return `<div class="space-y-3">${h}<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">${items
          .map((it) => `<div class="flex aspect-square items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center text-xs text-zinc-500">${it}</div>`)
          .join("")}</div></div>`;
      default:
        return ""; // unknown block type → dropped
    }
  };

  const nav = screens
    .map(
      (s, i) =>
        `<button data-nav="${ids[i]}" class="nav-btn rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition-colors">${escapeHtml(
          s.label || s.heading || `Screen ${i + 1}`,
        )}</button>`,
    )
    .join("");

  const screenHtml = screens
    .map((s, i) => {
      const img = safeImageUrl(s.imageUrl);
      const hero = `<div class="mb-8">
        ${img ? `<img src="${escapeHtml(img)}" alt="" class="mb-6 h-48 w-full rounded-2xl object-cover" />` : ""}
        <h2 class="text-3xl font-bold tracking-tight">${escapeHtml(s.heading)}</h2>
        ${s.subheading ? `<p class="mt-2 text-lg text-zinc-500">${escapeHtml(s.subheading)}</p>` : ""}
      </div>`;
      const blocks = (s.blocks ?? []).slice(0, 6).map(renderBlock).join('<div class="h-6"></div>');
      return `<section data-screen="${ids[i]}" class="${i === 0 ? "" : "hidden"} mx-auto max-w-3xl px-6 py-10">${hero}${blocks}</section>`;
    })
    .join("\n");

  // The ONLY script is ours (constant) — toggles screen visibility on nav/hash.
  const script = `<script>
  (function(){
    var screens=[].slice.call(document.querySelectorAll('[data-screen]'));
    var navs=[].slice.call(document.querySelectorAll('[data-nav]'));
    function show(id){
      if(!id||!screens.some(function(s){return s.getAttribute('data-screen')===id;})){id=screens[0]&&screens[0].getAttribute('data-screen');}
      screens.forEach(function(s){s.classList.toggle('hidden',s.getAttribute('data-screen')!==id);});
      navs.forEach(function(n){var a=n.getAttribute('data-nav')===id;n.style.color=a?'#111':'';n.style.background=a?'rgba(0,0,0,.05)':'';});
    }
    navs.forEach(function(n){n.addEventListener('click',function(){location.hash=n.getAttribute('data-nav');});});
    window.addEventListener('hashchange',function(){show(location.hash.slice(1));});
    show(location.hash.slice(1));
  })();
  </script>`;

  return `<!doctype html>
<html lang="sr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-zinc-900 antialiased">
  <nav class="sticky top-0 z-10 flex items-center gap-1 border-b border-zinc-200 bg-white/90 px-4 py-2.5 backdrop-blur">
    <span class="mr-2 font-bold">${title}</span>
    ${nav}
  </nav>
  ${screenHtml}
  ${script}
</body>
</html>`;
}
