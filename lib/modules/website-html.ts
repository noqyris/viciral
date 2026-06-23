/**
 * Pure, deterministic site-HTML assembly. We build the HTML ourselves from a
 * structured spec (never render model-authored HTML), and HTML-escape every
 * model/user string — so untrusted content can't inject markup or script. The
 * accent color is strictly validated to avoid CSS injection.
 */
import { escapeHtml } from "@/lib/html";

// Re-exported for callers/tests that import it from this module.
export { escapeHtml };

export interface SiteSpec {
  title: string;
  tagline: string;
  accent: string;
  hero: { heading: string; subheading: string; ctaText: string };
  sections: { heading: string; body: string }[];
  footer: string;
}

export interface SiteImages {
  heroUrl?: string;
  /** Per-section image URL (index-aligned with spec.sections); entries may be undefined. */
  sectionUrls: (string | undefined)[];
}

/** Returns the accent only if it is a plain hex color; otherwise a safe default. */
export function sanitizeAccent(accent: string, fallback = "#7c3aed"): string {
  const v = accent.trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback;
}

/** Only allow http(s) image URLs into the document; otherwise drop the image. */
function safeImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : undefined;
}

export function buildSiteHtml(spec: SiteSpec, images: SiteImages): string {
  const accent = sanitizeAccent(spec.accent);
  const title = escapeHtml(spec.title);
  const heroImg = safeImageUrl(images.heroUrl);

  const hero = `
  <header class="relative overflow-hidden">
    ${
      heroImg
        ? `<img src="${escapeHtml(heroImg)}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-30" />`
        : ""
    }
    <div class="relative mx-auto max-w-5xl px-6 py-28 text-center">
      <h1 class="text-4xl font-bold tracking-tight sm:text-6xl">${escapeHtml(spec.hero.heading)}</h1>
      <p class="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">${escapeHtml(spec.hero.subheading)}</p>
      <a href="#cta" class="mt-10 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white" style="background-color:${accent}">${escapeHtml(spec.hero.ctaText)}</a>
    </div>
  </header>`;

  const sections = spec.sections
    .map((s, i) => {
      const img = safeImageUrl(images.sectionUrls[i]);
      const reverse = i % 2 === 1;
      const imageBlock = img
        ? `<div class="flex-1"><img src="${escapeHtml(img)}" alt="" class="w-full rounded-2xl border border-zinc-200" /></div>`
        : "";
      const textBlock = `<div class="flex-1">
        <h2 class="text-2xl font-semibold tracking-tight">${escapeHtml(s.heading)}</h2>
        <p class="mt-4 whitespace-pre-line text-zinc-600">${escapeHtml(s.body)}</p>
      </div>`;
      return `<section class="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-16 ${
        reverse ? "md:flex-row-reverse" : "md:flex-row"
      }">${imageBlock}${textBlock}</section>`;
    })
    .join("\n");

  const cta = `
  <section id="cta" class="mx-auto my-8 max-w-5xl px-6">
    <div class="rounded-3xl px-8 py-16 text-center text-white" style="background-color:${accent}">
      <h2 class="text-3xl font-bold">${escapeHtml(spec.tagline)}</h2>
      <a href="#" class="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold" style="color:${accent}">${escapeHtml(spec.hero.ctaText)}</a>
    </div>
  </section>`;

  const footer = `
  <footer class="border-t border-zinc-200 py-10 text-center text-sm text-zinc-500">${escapeHtml(spec.footer)}</footer>`;

  return `<!doctype html>
<html lang="sr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-zinc-900 antialiased">
${hero}
${sections}
${cta}
${footer}
</body>
</html>`;
}
