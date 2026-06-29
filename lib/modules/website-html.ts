/**
 * Pure, deterministic site-HTML assembly (v2). We build 100% of the markup
 * ourselves from a structured, Zod-validated spec — never render model-authored
 * HTML — and HTML-escape every model/user string, so untrusted content can't
 * inject markup or script. Rendering is ENUM-GATED: a `switch` over the section
 * `type` whose `default` drops unknown types. The only model value reaching a
 * `style` attribute is the accent color, hex-validated + normalized to #rrggbb.
 * Image/link URLs are http(s)-only. Theme tokens come from a WE-owned table
 * (lib/modules/website-theme.ts) keyed by enum — no model string becomes CSS.
 */
import { escapeHtml } from "@/lib/html";
import {
  resolveTheme,
  faviconDataUri,
  sanitizeAccent,
  type ResolvedTheme,
} from "./website-theme";
import type { SiteSpec, Section } from "./website";

// Re-exported for callers/tests.
export { escapeHtml, sanitizeAccent };

export interface SiteImages {
  /** Generated image URLs keyed by a stable per-prompt key (e.g. "hero", "sec2-item1"). */
  byKey: Record<string, string | undefined>;
}

export interface BuildOpts {
  siteName: string;
  lang: string;
  seoTitle?: string;
  seoDescription?: string;
  favicon: string; // "initial" | "accent-dot" | "none"
  ogImageKey?: string;
  year: number;
  // Theme option enums (resolved here against the WE-owned token table).
  theme: string;
  mode: string;
  density: string;
  roundness: string;
  fontPairing: string;
  contentWidth: string;
  accentMode: string;
  accentColor?: string;
  brandColor?: string;
  ignoreBrand: boolean;
}

/** Only http(s) URLs may enter the document (images + links); else dropped. */
function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : undefined;
}
const safeImageUrl = safeUrl;
export { safeUrl };

function slug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
function anchorHref(a: string): string {
  const s = slug(a);
  return s ? `#${s}` : "#";
}
function safeEmail(e: string | undefined): string | undefined {
  const v = (e || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : undefined;
}
function safeTel(p: string | undefined): string | undefined {
  const d = (p || "").replace(/[^+0-9]/g, "");
  return d.length >= 4 ? d : undefined;
}

// Compact inline icons (stroke) for feature lists — the enum maps onto this set.
const ICON_PATHS: Record<string, string> = {
  check: '<path d="M5 13l4 4L19 7"/>',
  star: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8z"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  shield: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
  heart: '<path d="M12 21s-7-4.5-9-9c-1.6-3.6 2-7 5-5 1.3.9 2 2 2 2s.7-1.1 2-2c3-2 6.6 1.4 5 5-2 4.5-5 9-5 9z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3-5 7-5s7 1.7 7 5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  "trending-up": '<path d="M3 17l6-6 4 4 7-7"/><path d="M16 8h5v5"/>',
  "message-circle": '<path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-5A8 8 0 1121 12z"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  rocket: '<path d="M5 15c-1 1-1 4-1 4s3 0 4-1m6-12c3 0 5 2 5 5 0 4-4 8-9 10-2-1-3-2-4-4 2-5 6-9 10-9z"/>',
  sparkles: '<path d="M12 4l1.5 4L18 9.5 13.5 11 12 15l-1.5-4L6 9.5 10.5 8z"/>',
};
const ICON_ALIAS: Record<string, string> = { rocket: "rocket", sparkles: "sparkles" };
function iconSvg(name: string): string {
  const key = ICON_PATHS[name] ? name : ICON_ALIAS[name] ?? "";
  const path = ICON_PATHS[key];
  if (!path) return "";
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">${path}</svg>`;
}

// Compact social glyphs (our literals; selected by enum).
const SOCIAL_PATHS: Record<string, string> = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17.4" cy="6.6" r="1"/>',
  facebook: '<path d="M14 8h2V5h-2c-2 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.4-3H14V8.4c0-.3.2-.4.5-.4z"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 014 0v4" stroke="#fff"/>',
  x: '<path d="M4 4l16 16M20 4L4 20"/>',
  tiktok: '<path d="M15 4c.3 2 1.5 3.4 3.4 3.7v2.4c-1.2 0-2.4-.4-3.4-1v5.3c0 2.8-2 4.9-4.8 4.9S5.5 17 5.5 14.3c0-2.6 2-4.7 4.6-4.8v2.5c-1.1.1-2 1-2 2.3 0 1.3 1 2.3 2.2 2.3s2.2-1 2.2-2.5V4z"/>',
  youtube: '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18"/>',
};
function socialSvg(network: string): string {
  const path = SOCIAL_PATHS[network];
  if (!path) return SOCIAL_PATHS.website;
  return path;
}

export function buildSiteHtml(spec: SiteSpec, images: SiteImages, opts: BuildOpts): string {
  const th: ResolvedTheme = resolveTheme({
    theme: opts.theme,
    modelTheme: spec.meta.theme,
    mode: opts.mode,
    density: opts.density,
    roundness: opts.roundness,
    fontPairing: opts.fontPairing,
    contentWidth: opts.contentWidth,
    accentMode: opts.accentMode,
    accentColor: opts.accentColor,
    brandColor: opts.brandColor,
    modelAccent: spec.meta.accent,
    ignoreBrand: opts.ignoreBrand,
  });

  const A = th.accent; // normalized #rrggbb — safe to append an alpha pair
  const c = th.colors;
  const d = th.density;
  const r = th.radius;
  const headCls = `${th.shape.headingWeight} ${th.shape.headingTracking}`;
  const img = (key: string): string | undefined => safeImageUrl(images.byKey[key]);

  const wrap = (inner: string, id?: string) =>
    `<section${id ? ` id="${slug(id)}"` : ""} class="mx-auto ${th.width} px-6 ${d.sectionY}">${inner}</section>`;
  const h2 = (t: string) => `<h2 class="text-2xl ${headCls} sm:text-3xl">${escapeHtml(t)}</h2>`;
  const sub = (t?: string) => (t ? `<p class="mx-auto mt-3 max-w-2xl ${c.mutedText}">${escapeHtml(t)}</p>` : "");
  const primaryBtn = (label: string, anchor: string) =>
    `<a href="${anchorHref(anchor)}" class="inline-block ${r.button} px-6 py-3 text-sm font-semibold" style="background-color:${A};color:${th.ctaText}">${escapeHtml(label)}</a>`;
  const ghostBtn = (label: string, anchor: string) =>
    `<a href="${anchorHref(anchor)}" class="inline-block ${r.button} border ${c.borderColor} px-6 py-3 text-sm font-semibold">${escapeHtml(label)}</a>`;
  const check = `<svg viewBox="0 0 24 24" fill="none" stroke="${A}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 h-4 w-4 shrink-0"><path d="M5 13l4 4L19 7"/></svg>`;

  // ---- Per-section renderers (WE author all markup) ----
  const renderHero = (s: Extract<Section, { type: "hero" }>): string => {
    const heroImg = img("hero");
    const eyebrow = s.eyebrow
      ? `<p class="mb-4 text-sm font-semibold uppercase tracking-[0.2em]" style="color:${A}">${escapeHtml(s.eyebrow)}</p>`
      : "";
    const badges = (s.badges ?? []).length
      ? `<div class="mt-8 flex flex-wrap justify-center gap-2">${(s.badges ?? [])
          .map((b) => `<span class="rounded-full ${c.surfaceBg} px-3 py-1 text-xs font-medium ${c.mutedText}">${escapeHtml(b)}</span>`)
          .join("")}</div>`
      : "";
    const ctas = `<div class="mt-10 flex flex-wrap items-center justify-center gap-3">${primaryBtn(
      s.primaryCta.label,
      s.primaryCta.anchor,
    )}${s.secondaryCta ? ghostBtn(s.secondaryCta.label, s.secondaryCta.anchor) : ""}</div>`;
    const heading = `<h1 class="text-4xl ${headCls} sm:text-6xl">${escapeHtml(s.heading)}</h1>`;
    const subh = `<p class="mx-auto mt-6 max-w-2xl text-lg ${c.mutedText}">${escapeHtml(s.subheading)}</p>`;

    if ((s.layout === "split-right" || s.layout === "split-left") && heroImg) {
      const textCol = `<div class="flex-1 ${s.layout === "split-left" ? "md:order-2" : ""}">${eyebrow}<h1 class="text-4xl ${headCls} sm:text-5xl">${escapeHtml(
        s.heading,
      )}</h1><p class="mt-6 max-w-xl text-lg ${c.mutedText}">${escapeHtml(s.subheading)}</p><div class="mt-8 flex flex-wrap gap-3">${primaryBtn(
        s.primaryCta.label,
        s.primaryCta.anchor,
      )}${s.secondaryCta ? ghostBtn(s.secondaryCta.label, s.secondaryCta.anchor) : ""}</div></div>`;
      const imgCol = `<div class="flex-1"><img src="${escapeHtml(heroImg)}" alt="" class="w-full ${r.image} object-cover shadow-xl" /></div>`;
      return `<header class="mx-auto ${th.width} px-6 ${d.heroY}"><div class="flex flex-col items-center ${d.gap} md:flex-row">${textCol}${imgCol}</div></header>`;
    }
    const bg = heroImg
      ? `<img src="${escapeHtml(heroImg)}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-20" />`
      : "";
    return `<header class="relative overflow-hidden">${bg}<div class="relative mx-auto ${th.width} px-6 ${d.heroY} text-center">${eyebrow}${heading}${subh}${ctas}${badges}</div></header>`;
  };

  const renderFeatureGrid = (s: Extract<Section, { type: "feature-grid" }>): string => {
    const cols = s.columns === 4 ? "lg:grid-cols-4" : s.columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
    const cards = s.items
      .map((it, j) => {
        const thumb = img(`sec${secIndex}-item${j}`);
        const icon = it.icon !== "none" && iconSvg(it.icon)
          ? `<span class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl" style="background-color:${A}1a;color:${A}">${iconSvg(it.icon)}</span>`
          : "";
        const im = thumb ? `<img src="${escapeHtml(thumb)}" alt="" class="mb-4 aspect-video w-full ${r.image} object-cover" />` : "";
        return `<div class="border ${c.borderColor} p-6 ${r.card}">${im}${icon}<h3 class="text-lg font-semibold">${escapeHtml(
          it.title,
        )}</h3><p class="mt-2 ${c.mutedText}">${escapeHtml(it.body)}</p></div>`;
      })
      .join("");
    const head = s.heading ? `<div class="mb-10 text-center">${h2(s.heading)}${sub(s.subheading)}</div>` : "";
    return wrap(`${head}<div class="grid grid-cols-1 ${cols} ${d.gap}">${cards}</div>`);
  };

  const renderSteps = (s: Extract<Section, { type: "steps" }>): string => {
    const items = s.items
      .map((it, j) => {
        const badge = `<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" style="background-color:${A};color:${th.ctaText}">${j + 1}</span>`;
        if (s.variant === "timeline") {
          return `<div class="flex gap-4 border-l-2 pb-8 pl-6" style="border-color:${A}">${badge}<div><h3 class="font-semibold">${escapeHtml(
            it.title,
          )}</h3><p class="mt-1 ${c.mutedText}">${escapeHtml(it.body)}</p></div></div>`;
        }
        return `<div class="${r.card} border ${c.borderColor} p-6"><div class="flex items-center gap-3">${badge}<h3 class="font-semibold">${escapeHtml(
          it.title,
        )}</h3></div><p class="mt-3 ${c.mutedText}">${escapeHtml(it.body)}</p></div>`;
      })
      .join("");
    const layout = s.variant === "timeline" ? "max-w-2xl" : `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${d.gap}`;
    return wrap(`<div class="mb-10 text-center">${h2(s.heading)}${sub(s.subheading)}</div><div class="${layout}">${items}</div>`);
  };

  const renderStats = (s: Extract<Section, { type: "stats" }>): string => {
    const onAccent = s.tone === "accent";
    const cols = s.items.length >= 4 ? "sm:grid-cols-4" : s.items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
    const items = s.items
      .map(
        (it) =>
          `<div class="text-center"><div class="text-4xl ${th.shape.headingWeight}">${escapeHtml(it.value)}</div><div class="mt-1 text-sm ${
            onAccent ? "opacity-90" : c.mutedText
          }">${escapeHtml(it.label)}</div></div>`,
      )
      .join("");
    const head = s.heading ? `<h2 class="mb-10 text-center text-2xl ${headCls} sm:text-3xl">${escapeHtml(s.heading)}</h2>` : "";
    const grid = `<div class="grid grid-cols-2 ${cols} ${d.gap}">${items}</div>`;
    if (onAccent) {
      return `<section class="px-6 ${d.sectionY}"><div class="mx-auto ${th.width} ${r.card} px-8 py-14 text-white" style="background-color:${A};color:${th.ctaText}">${head}${grid}</div></section>`;
    }
    return wrap(`${head}${grid}`);
  };

  const renderTestimonials = (s: Extract<Section, { type: "testimonials" }>): string => {
    const cards = s.items
      .map((it, j) => {
        const av = img(`sec${secIndex}-av${j}`);
        const avatar = av
          ? `<img src="${escapeHtml(av)}" alt="" class="h-10 w-10 rounded-full object-cover" />`
          : `<span class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style="background-color:${A};color:${th.ctaText}">${escapeHtml(
              (it.author || "?").slice(0, 1).toUpperCase(),
            )}</span>`;
        const stars = it.rating
          ? `<div class="mb-3" style="color:${A}">${"★".repeat(Math.max(1, Math.min(5, it.rating)))}<span class="${c.mutedText}">${"★".repeat(
              5 - Math.max(1, Math.min(5, it.rating)),
            )}</span></div>`
          : "";
        return `<figure class="${r.card} border ${c.borderColor} p-6">${stars}<blockquote class="${c.mutedText}">“${escapeHtml(
          it.quote,
        )}”</blockquote><figcaption class="mt-5 flex items-center gap-3">${avatar}<div><div class="text-sm font-semibold">${escapeHtml(
          it.author,
        )}</div>${it.role ? `<div class="text-xs ${c.mutedText}">${escapeHtml(it.role)}</div>` : ""}</div></figcaption></figure>`;
      })
      .join("");
    const head = s.heading ? `<div class="mb-10 text-center">${h2(s.heading)}</div>` : "";
    return wrap(`${head}<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">${cards}</div>`);
  };

  const renderLogoCloud = (s: Extract<Section, { type: "logo-cloud" }>): string => {
    const names = s.names
      .map((n) => `<span class="text-lg font-semibold tracking-wide ${c.mutedText}">${escapeHtml(n)}</span>`)
      .join("");
    const head = s.heading ? `<p class="mb-8 text-center text-sm uppercase tracking-widest ${c.mutedText}">${escapeHtml(s.heading)}</p>` : "";
    return wrap(`${head}<div class="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">${names}</div>`);
  };

  const renderPricing = (s: Extract<Section, { type: "pricing" }>): string => {
    let highlightedSeen = false;
    const cols = s.plans.length >= 3 ? "md:grid-cols-3" : s.plans.length === 2 ? "md:grid-cols-2" : "max-w-md mx-auto";
    const cards = s.plans
      .map((p) => {
        const hot = p.highlighted && !highlightedSeen;
        if (hot) highlightedSeen = true;
        const feats = p.features
          .map((f) => `<li class="flex items-start gap-2">${check}<span class="${c.mutedText}">${escapeHtml(f)}</span></li>`)
          .join("");
        const ribbon = hot ? `<span class="absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-semibold text-white" style="background-color:${A};color:${th.ctaText}">★</span>` : "";
        const cta = hot
          ? `<a href="${anchorHref(p.cta.anchor)}" class="mt-6 block ${r.button} px-5 py-2.5 text-center text-sm font-semibold" style="background-color:${A};color:${th.ctaText}">${escapeHtml(p.cta.label)}</a>`
          : `<a href="${anchorHref(p.cta.anchor)}" class="mt-6 block ${r.button} border ${c.borderColor} px-5 py-2.5 text-center text-sm font-semibold">${escapeHtml(p.cta.label)}</a>`;
        return `<div class="relative ${r.card} border ${hot ? "border-2" : c.borderColor} p-6"${hot ? ` style="border-color:${A}"` : ""}>${ribbon}<h3 class="text-lg font-semibold">${escapeHtml(
          p.name,
        )}</h3><div class="mt-2 text-3xl font-bold">${escapeHtml(p.price)}</div>${
          p.description ? `<p class="mt-1 text-sm ${c.mutedText}">${escapeHtml(p.description)}</p>` : ""
        }<ul class="mt-6 space-y-2">${feats}</ul>${cta}</div>`;
      })
      .join("");
    return wrap(
      `<div class="mb-10 text-center">${h2(s.heading)}${sub(s.subheading)}${
        s.billingNote ? `<p class="mt-2 text-xs ${c.mutedText}">${escapeHtml(s.billingNote)}</p>` : ""
      }</div><div class="grid grid-cols-1 ${cols} ${d.gap}">${cards}</div>`,
    );
  };

  const renderFaq = (s: Extract<Section, { type: "faq" }>): string => {
    const items = s.items
      .map(
        (it) =>
          `<details class="border-b ${c.borderColor} py-4"><summary class="cursor-pointer list-none font-medium">${escapeHtml(
            it.question,
          )}</summary><p class="mt-3 whitespace-pre-line ${c.mutedText}">${escapeHtml(it.answer)}</p></details>`,
      )
      .join("");
    return `<section id="faq" class="mx-auto max-w-3xl px-6 ${d.sectionY}"><h2 class="mb-8 text-center text-2xl ${headCls} sm:text-3xl">${escapeHtml(
      s.heading,
    )}</h2>${items}</section>`;
  };

  const renderGallery = (s: Extract<Section, { type: "gallery" }>): string => {
    const tiles = s.items
      .map((it, j) => {
        const u = img(`sec${secIndex}-item${j}`);
        const inner = u
          ? `<img src="${escapeHtml(u)}" alt="" class="h-full w-full object-cover" />`
          : `<div class="flex h-full w-full items-center justify-center p-3 text-center text-xs text-white" style="background-image:linear-gradient(135deg,${A},${th.accentMix})">${escapeHtml(
              it.caption ?? "",
            )}</div>`;
        return `<figure class="aspect-square overflow-hidden ${r.image}">${inner}${
          u && it.caption ? `<figcaption class="mt-1 text-xs ${c.mutedText}">${escapeHtml(it.caption)}</figcaption>` : ""
        }</figure>`;
      })
      .join("");
    const grid = s.layout === "masonry-3" ? "columns-2 md:columns-3 gap-4 [&>figure]:mb-4" : "grid grid-cols-2 md:grid-cols-3 gap-4";
    const head = s.heading ? `<div class="mb-8 text-center">${h2(s.heading)}</div>` : "";
    return wrap(`${head}<div class="${grid}">${tiles}</div>`);
  };

  const renderAbout = (s: Extract<Section, { type: "about" }>): string => {
    const im = img(`sec${secIndex}`);
    const highlights = (s.highlights ?? []).length
      ? `<ul class="mt-6 space-y-2">${(s.highlights ?? [])
          .map((h) => `<li class="flex items-start gap-2">${check}<span class="${c.mutedText}">${escapeHtml(h)}</span></li>`)
          .join("")}</ul>`
      : "";
    const prose = `<div class="flex-1"><h2 class="text-2xl ${headCls} sm:text-3xl">${escapeHtml(
      s.heading,
    )}</h2><p class="mt-4 whitespace-pre-line ${c.mutedText}">${escapeHtml(s.body)}</p>${highlights}</div>`;
    if (!im) return wrap(`<div class="mx-auto max-w-3xl">${prose}</div>`);
    const imgCol = `<div class="flex-1"><img src="${escapeHtml(im)}" alt="" class="w-full ${r.image} object-cover" /></div>`;
    return wrap(
      `<div class="flex flex-col items-center ${d.gap} md:flex-row">${s.imageSide === "left" ? imgCol + prose : prose + imgCol}</div>`,
    );
  };

  const renderTeam = (s: Extract<Section, { type: "team" }>): string => {
    const members = s.members
      .map((m, j) => {
        const av = img(`sec${secIndex}-av${j}`);
        const avatar = av
          ? `<img src="${escapeHtml(av)}" alt="" class="mx-auto h-24 w-24 rounded-full object-cover" />`
          : `<span class="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold" style="background-color:${A};color:${th.ctaText}">${escapeHtml(
              (m.name || "?").slice(0, 1).toUpperCase(),
            )}</span>`;
        return `<div class="text-center">${avatar}<div class="mt-3 font-semibold">${escapeHtml(m.name)}</div>${
          m.role ? `<div class="text-sm" style="color:${A}">${escapeHtml(m.role)}</div>` : ""
        }${m.bio ? `<p class="mt-2 text-sm ${c.mutedText}">${escapeHtml(m.bio)}</p>` : ""}</div>`;
      })
      .join("");
    return wrap(
      `<h2 class="mb-10 text-center text-2xl ${headCls} sm:text-3xl">${escapeHtml(s.heading)}</h2><div class="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">${members}</div>`,
    );
  };

  const renderCta = (s: Extract<Section, { type: "cta" }>): string => {
    const dark = s.tone === "dark";
    const ctas = `<div class="mt-8 flex flex-wrap items-center justify-center gap-3"><a href="${anchorHref(
      s.primary.anchor,
    )}" class="inline-block ${r.button} bg-white px-6 py-3 text-sm font-semibold" style="color:${dark ? "#111111" : A}">${escapeHtml(
      s.primary.label,
    )}</a>${
      s.secondary
        ? `<a href="${anchorHref(s.secondary.anchor)}" class="inline-block ${r.button} border border-white/40 px-6 py-3 text-sm font-semibold text-white">${escapeHtml(
            s.secondary.label,
          )}</a>`
        : ""
    }</div>`;
    const style = dark ? "" : ` style="background-color:${A};color:${th.ctaText}"`;
    const bg = dark ? "bg-zinc-950" : "";
    return `<section id="cta" class="px-6 ${d.sectionY}"><div class="mx-auto ${th.width} ${r.card} px-8 py-16 text-center text-white ${bg}"${style}><h2 class="text-3xl ${th.shape.headingWeight}">${escapeHtml(
      s.heading,
    )}</h2>${s.subheading ? `<p class="mx-auto mt-3 max-w-xl opacity-90">${escapeHtml(s.subheading)}</p>` : ""}${ctas}</div></section>`;
  };

  const renderContact = (s: Extract<Section, { type: "contact" }>): string => {
    const email = safeEmail(s.email);
    const tel = safeTel(s.phone);
    const details = `<div class="space-y-3 ${c.mutedText}">${
      email ? `<div><a href="mailto:${escapeHtml(email)}" class="hover:underline" style="color:${A}">${escapeHtml(email)}</a></div>` : ""
    }${tel ? `<div><a href="tel:${escapeHtml(tel)}" class="hover:underline" style="color:${A}">${escapeHtml(tel)}</a></div>` : ""}${
      s.address ? `<div>${escapeHtml(s.address)}</div>` : ""
    }</div>`;
    const socials = (s.socials ?? [])
      .map((so) => {
        const u = safeUrl(so.url);
        if (!u) return "";
        return `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer nofollow" class="inline-flex h-10 w-10 items-center justify-center rounded-full border ${c.borderColor}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-5 w-5">${socialSvg(
          so.network,
        )}</svg></a>`;
      })
      .join("");
    const socialRow = socials ? `<div class="mt-6 flex gap-2">${socials}</div>` : "";
    return wrap(
      `<div class="mx-auto max-w-3xl text-center"><h2 class="text-2xl ${headCls} sm:text-3xl">${escapeHtml(s.heading)}</h2>${sub(
        s.subheading,
      )}<div class="mt-8 flex flex-col items-center">${details}${socialRow}</div></div>`,
      "contact",
    );
  };

  const renderNewsletter = (s: Extract<Section, { type: "newsletter" }>): string => {
    return `<section class="px-6 ${d.sectionY}"><div class="mx-auto ${th.width} ${r.card} ${c.surfaceBg} px-8 py-14 text-center"><h2 class="text-2xl ${headCls} sm:text-3xl">${escapeHtml(
      s.heading,
    )}</h2>${sub(s.subheading)}<div class="mx-auto mt-6 flex max-w-md gap-2"><input type="email" placeholder="email@primer.com" class="flex-1 ${r.button} border ${c.borderColor} bg-transparent px-4 py-2.5 text-sm" /><a href="#contact" class="${r.button} px-5 py-2.5 text-sm font-semibold" style="background-color:${A};color:${th.ctaText}">${escapeHtml(
      s.buttonLabel,
    )}</a></div></div></section>`;
  };

  const renderTextBlock = (s: Extract<Section, { type: "text-block" }>): string => {
    const align = s.align === "center" ? "text-center mx-auto" : "";
    const band = s.tone === "muted" ? c.surfaceBg : s.tone === "dark" ? "bg-zinc-950 text-zinc-100" : "";
    const inner = `<div class="mx-auto max-w-3xl ${align}">${
      s.heading ? `<h2 class="text-2xl ${headCls} sm:text-3xl">${escapeHtml(s.heading)}</h2>` : ""
    }<p class="mt-4 whitespace-pre-line ${c.mutedText}">${escapeHtml(s.body)}</p></div>`;
    if (band) return `<section class="px-6 ${d.sectionY} ${band}"><div class="mx-auto ${th.width}">${inner}</div></section>`;
    return wrap(inner);
  };

  const renderFooter = (s: Extract<Section, { type: "footer" }>): string => {
    const cols = (s.columns ?? [])
      .map(
        (col) =>
          `<div><div class="mb-3 text-sm font-semibold">${escapeHtml(col.title)}</div><ul class="space-y-2 text-sm ${c.mutedText}">${col.links
            .map((l) => `<li><a href="${anchorHref(l.anchor)}" class="hover:underline">${escapeHtml(l.label)}</a></li>`)
            .join("")}</ul></div>`,
      )
      .join("");
    const top = cols
      ? `<div class="mx-auto ${th.width} px-6 py-12"><div class="grid grid-cols-2 gap-8 md:grid-cols-4">${
          s.tagline ? `<div class="col-span-2 md:col-span-1"><div class="font-bold">${escapeHtml(opts.siteName)}</div><p class="mt-2 text-sm ${c.mutedText}">${escapeHtml(s.tagline)}</p></div>` : ""
        }${cols}</div></div>`
      : "";
    const copyright = escapeHtml(s.copyright || `© ${opts.year} ${opts.siteName}`);
    return `<footer class="border-t ${c.borderColor}">${top}<div class="px-6 py-8 text-center text-sm ${c.mutedText}">${copyright}</div></footer>`;
  };

  let secIndex = 0;
  const renderSection = (s: Section, i: number): string => {
    secIndex = i;
    switch (s.type) {
      case "hero":
        return renderHero(s);
      case "feature-grid":
        return renderFeatureGrid(s);
      case "steps":
        return renderSteps(s);
      case "stats":
        return renderStats(s);
      case "testimonials":
        return renderTestimonials(s);
      case "logo-cloud":
        return renderLogoCloud(s);
      case "pricing":
        return renderPricing(s);
      case "faq":
        return renderFaq(s);
      case "gallery":
        return renderGallery(s);
      case "about":
        return renderAbout(s);
      case "team":
        return renderTeam(s);
      case "cta":
        return renderCta(s);
      case "contact":
        return renderContact(s);
      case "newsletter":
        return renderNewsletter(s);
      case "text-block":
        return renderTextBlock(s);
      case "footer":
        return renderFooter(s);
      default: {
        const _exhaustive: never = s;
        void _exhaustive;
        return ""; // unknown type → dropped
      }
    }
  };

  const body = spec.sections.map((s, i) => renderSection(s, i)).join("\n");

  // ---- Nav (sticky), <head>, SEO, favicon ----
  const navLinks = spec.meta.navLinks
    .map((l) => `<a href="${anchorHref(l.anchor)}" class="text-sm font-medium ${c.mutedText} hover:opacity-70">${escapeHtml(l.label)}</a>`)
    .join("");
  const nav = `<nav class="sticky top-0 z-20 border-b ${c.borderColor} ${c.pageBg}/90 backdrop-blur"><div class="mx-auto ${th.width} flex items-center justify-between px-6 py-3"><span class="font-bold">${escapeHtml(
    opts.siteName,
  )}</span><div class="hidden items-center gap-6 md:flex">${navLinks}</div></div></nav>`;

  const title = escapeHtml(opts.seoTitle || spec.meta.title);
  const desc = escapeHtml(opts.seoDescription || spec.meta.description);
  const ogUrl = opts.ogImageKey ? safeImageUrl(images.byKey[opts.ogImageKey]) : undefined;
  const ogTag = ogUrl ? `\n  <meta property="og:image" content="${escapeHtml(ogUrl)}" />` : "";

  let faviconLink = "";
  if (opts.favicon === "initial") {
    faviconLink = `\n  <link rel="icon" href="${faviconDataUri(opts.siteName, A, th.ctaText)}" />`;
  } else if (opts.favicon === "accent-dot") {
    const dot = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='28' fill='${A}'/></svg>`)}`;
    faviconLink = `\n  <link rel="icon" href="${dot}" />`;
  }

  const fontLink =
    th.font.link && /^[A-Za-z0-9:;@&+.]+$/.test(th.font.link)
      ? `\n  <link rel="preconnect" href="https://fonts.googleapis.com" /><link href="https://fonts.googleapis.com/css2?family=${th.font.link}&display=swap" rel="stylesheet" />`
      : "";
  const bodyStyle = th.font.link ? ` style="font-family:${th.font.bodyFamily}"` : "";
  const lang = /^[a-z]{2}$/.test(opts.lang) ? opts.lang : "sr";

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:type" content="website" />${ogTag}
  <meta name="twitter:card" content="${ogUrl ? "summary_large_image" : "summary"}" />${faviconLink}
  <script src="https://cdn.tailwindcss.com"></script>${fontLink}
</head>
<body class="${c.pageBg} ${c.pageText} antialiased"${bodyStyle}>
${nav}
${body}
</body>
</html>`;
}
