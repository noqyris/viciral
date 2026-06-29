/**
 * Web Builder theme system — pure, deterministic token tables + resolvers.
 *
 * SAFETY: no model/user string ever becomes markup or CSS here. The model/user
 * only pick an enum *key*; an out-of-enum key resolves via `?? fallback` to one
 * of OUR literal values. The only model-driven value that reaches a `style`
 * attribute is the accent color, and it is hex-validated (sanitizeAccent) before
 * use — so it cannot break out of the CSS declaration.
 */
import { escapeHtml } from "@/lib/html";

export type ThemeName = "minimal" | "bold" | "elegant" | "corporate";
export type Mode = "light" | "dark";

export interface ColorBlock {
  pageBg: string;
  pageText: string;
  surfaceBg: string;
  surfaceText: string;
  mutedText: string;
  borderColor: string;
}

// --- Per-theme color blocks (light + dark). MVP ships 4; shape supports more. ---
export const THEME_COLORS: Record<ThemeName, Record<Mode, ColorBlock>> = {
  minimal: {
    light: { pageBg: "bg-white", pageText: "text-zinc-900", surfaceBg: "bg-zinc-50", surfaceText: "text-zinc-900", mutedText: "text-zinc-600", borderColor: "border-zinc-200" },
    dark: { pageBg: "bg-zinc-950", pageText: "text-zinc-100", surfaceBg: "bg-zinc-900", surfaceText: "text-zinc-100", mutedText: "text-zinc-400", borderColor: "border-zinc-800" },
  },
  bold: {
    light: { pageBg: "bg-zinc-950", pageText: "text-white", surfaceBg: "bg-zinc-900", surfaceText: "text-white", mutedText: "text-zinc-400", borderColor: "border-zinc-800" },
    dark: { pageBg: "bg-black", pageText: "text-white", surfaceBg: "bg-zinc-950", surfaceText: "text-white", mutedText: "text-zinc-500", borderColor: "border-zinc-800" },
  },
  elegant: {
    light: { pageBg: "bg-[#faf8f4]", pageText: "text-stone-900", surfaceBg: "bg-white", surfaceText: "text-stone-900", mutedText: "text-stone-600", borderColor: "border-stone-200" },
    dark: { pageBg: "bg-stone-950", pageText: "text-stone-100", surfaceBg: "bg-stone-900", surfaceText: "text-stone-100", mutedText: "text-stone-400", borderColor: "border-stone-800" },
  },
  corporate: {
    light: { pageBg: "bg-white", pageText: "text-slate-800", surfaceBg: "bg-slate-50", surfaceText: "text-slate-900", mutedText: "text-slate-600", borderColor: "border-slate-200" },
    dark: { pageBg: "bg-slate-950", pageText: "text-slate-100", surfaceBg: "bg-slate-900", surfaceText: "text-slate-100", mutedText: "text-slate-400", borderColor: "border-slate-800" },
  },
};

interface ThemeShape {
  headingWeight: string;
  headingTracking: string;
  radius: RoundKey;
  button: string;
  prefersDark: boolean;
  defaultDensity: DensityKey;
  defaultWidth: WidthKey;
  defaultFont: FontKey;
}

export const THEME_SHAPE: Record<ThemeName, ThemeShape> = {
  minimal: { headingWeight: "font-semibold", headingTracking: "tracking-tight", radius: "lg", button: "rounded-lg", prefersDark: false, defaultDensity: "cozy", defaultWidth: "standard", defaultFont: "sans-modern" },
  bold: { headingWeight: "font-extrabold", headingTracking: "tracking-tighter", radius: "xl", button: "rounded-full", prefersDark: true, defaultDensity: "spacious", defaultWidth: "standard", defaultFont: "geometric" },
  elegant: { headingWeight: "font-medium", headingTracking: "tracking-tight", radius: "md", button: "rounded-none", prefersDark: false, defaultDensity: "spacious", defaultWidth: "narrow", defaultFont: "elegant-serif" },
  corporate: { headingWeight: "font-bold", headingTracking: "tracking-tight", radius: "md", button: "rounded-lg", prefersDark: false, defaultDensity: "cozy", defaultWidth: "wide", defaultFont: "sans-modern" },
};

export const THEME_DEFAULT_ACCENT: Record<ThemeName, string> = {
  minimal: "#18181b",
  bold: "#6d28d9",
  elegant: "#7c5c3e",
  corporate: "#1e40af",
};

type DensityKey = "compact" | "cozy" | "spacious";
export interface DensityTokens {
  sectionY: string;
  heroY: string;
  gap: string;
  bodyMt: string;
  stackY: string;
}
export const DENSITY_SCALE: Record<DensityKey, DensityTokens> = {
  compact: { sectionY: "py-10", heroY: "py-16", gap: "gap-6", bodyMt: "mt-3", stackY: "space-y-2" },
  cozy: { sectionY: "py-16", heroY: "py-24", gap: "gap-10", bodyMt: "mt-4", stackY: "space-y-3" },
  spacious: { sectionY: "py-24", heroY: "py-32", gap: "gap-16", bodyMt: "mt-6", stackY: "space-y-4" },
};

type RoundKey = "none" | "sm" | "md" | "lg" | "xl" | "2xl";
export interface RadiusTokens {
  card: string;
  button: string;
  image: string;
}
export const RADIUS_SCALE: Record<RoundKey, RadiusTokens> = {
  none: { card: "rounded-none", button: "rounded-none", image: "rounded-none" },
  sm: { card: "rounded-lg", button: "rounded-md", image: "rounded-lg" },
  md: { card: "rounded-xl", button: "rounded-lg", image: "rounded-xl" },
  lg: { card: "rounded-2xl", button: "rounded-xl", image: "rounded-2xl" },
  xl: { card: "rounded-3xl", button: "rounded-2xl", image: "rounded-3xl" },
  "2xl": { card: "rounded-[2rem]", button: "rounded-full", image: "rounded-[2rem]" },
};
// User "roundness" enum → a RADIUS_SCALE key ("auto" uses the theme's own radius).
export const ROUNDNESS_MAP: Record<string, RoundKey> = { sharp: "none", subtle: "sm", rounded: "lg", pill: "2xl" };

type WidthKey = "narrow" | "standard" | "wide";
export const WIDTH_SCALE: Record<WidthKey, string> = {
  narrow: "max-w-3xl",
  standard: "max-w-5xl",
  wide: "max-w-7xl",
};

type FontKey = "system" | "sans-modern" | "serif-editorial" | "geometric" | "elegant-serif";
export interface FontPairing {
  headingFamily: string;
  bodyFamily: string;
  /** Google-fonts css2 family slug (our literal), or null for system fonts. */
  link: string | null;
}
export const FONT_PAIRINGS: Record<FontKey, FontPairing> = {
  system: { headingFamily: "ui-sans-serif, system-ui, sans-serif", bodyFamily: "ui-sans-serif, system-ui, sans-serif", link: null },
  "sans-modern": { headingFamily: "Inter, ui-sans-serif, system-ui, sans-serif", bodyFamily: "Inter, ui-sans-serif, system-ui, sans-serif", link: "Inter:wght@400;600;800" },
  "serif-editorial": { headingFamily: "'Playfair Display', Georgia, serif", bodyFamily: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif", link: "Playfair+Display:wght@500;700&family=Source+Sans+3:wght@400;600" },
  geometric: { headingFamily: "Poppins, ui-sans-serif, system-ui, sans-serif", bodyFamily: "Inter, ui-sans-serif, system-ui, sans-serif", link: "Poppins:wght@600;800&family=Inter:wght@400;500" },
  "elegant-serif": { headingFamily: "'Cormorant Garamond', Georgia, serif", bodyFamily: "Jost, ui-sans-serif, system-ui, sans-serif", link: "Cormorant+Garamond:wght@500;700&family=Jost:wght@400;500" },
};

// ---- Color math (pure) ----
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  let h = (hex || "").replace("#", "").trim();
  if (h.length === 3 || h.length === 4) {
    h = h
      .slice(0, 3)
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (h.length === 6 || h.length === 8) {
    h = h.slice(0, 6);
  } else {
    return null;
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function relLuminance(hex: string): number {
  const c = parseHex(hex);
  if (!c) return 0;
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Darkens a hex toward black by `pct`, returning a fresh #rrggbb WE format. */
export function darken(hex: string, pct = 0.18): string {
  const c = parseHex(hex);
  if (!c) return hex;
  return toHex(c.r * (1 - pct), c.g * (1 - pct), c.b * (1 - pct));
}

/** Ink or white text that reads on top of the (hex) accent — fixes "white on yellow". */
export function ctaTextColor(accent: string): "#111111" | "#ffffff" {
  return relLuminance(accent) > 0.5 ? "#111111" : "#ffffff";
}

/** The accent only if it is a plain hex; otherwise empty (so callers can try the next candidate). */
export function sanitizeAccent(accent: string | undefined, fallback = "#7c3aed"): string {
  const v = (accent || "").trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback;
}

/** First letter of a name as a safe single glyph (for monograms/favicons). */
export function safeGlyph(name: string): string {
  const ch = [...(name || "")][0] ?? "";
  return /[\p{L}\p{N}]/u.test(ch) ? ch.toUpperCase() : "•";
}

/** A self-authored SVG favicon as a data URI — encodeURIComponent neutralizes all content. */
export function faviconDataUri(letter: string, accent: string, textColor: string): string {
  const ch = escapeHtml(safeGlyph(letter));
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>` +
    `<rect width='64' height='64' rx='14' fill='${accent}'/>` +
    `<text x='32' y='45' font-family='system-ui,sans-serif' font-size='38' font-weight='700' text-anchor='middle' fill='${textColor}'>${ch}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---- Resolution ----
export interface ThemeOptions {
  theme: string; // "auto" | ThemeName
  modelTheme?: string; // spec.meta.theme suggestion
  mode: string; // "auto" | "light" | "dark"
  density: string;
  roundness: string;
  fontPairing: string;
  contentWidth: string;
  accentMode: string; // "brand" | "custom" | "auto"
  accentColor?: string;
  brandColor?: string;
  modelAccent?: string;
  ignoreBrand: boolean;
}

export interface ResolvedTheme {
  name: ThemeName;
  mode: Mode;
  colors: ColorBlock;
  shape: ThemeShape;
  density: DensityTokens;
  radius: RadiusTokens;
  width: string;
  font: FontPairing;
  accent: string;
  accentMix: string;
  ctaText: string;
}

function asTheme(name: string | undefined): ThemeName | undefined {
  return name === "minimal" || name === "bold" || name === "elegant" || name === "corporate" ? name : undefined;
}

/** Normalizes a valid hex to #rrggbb (expands shorthand, drops alpha); null if invalid. */
function normalizeHex(hex: string): string | null {
  const c = parseHex(hex);
  return c ? toHex(c.r, c.g, c.b) : null;
}

/**
 * Pick the accent by precedence; each candidate hex-validated AND normalized to
 * #rrggbb (so callers can safely append an alpha pair, e.g. `${accent}1a`). The
 * final fallback is a hard-coded 6-digit literal — an invalid accent can never
 * escape. Readability is handled by {@link ctaTextColor} (ink/white over the
 * accent), so we don't reject bright brand colors for low page-bg contrast.
 */
function resolveAccent(o: ThemeOptions, name: ThemeName): string {
  const candidates = [
    o.accentMode === "custom" ? o.accentColor : undefined,
    o.ignoreBrand ? undefined : o.brandColor,
    o.modelAccent,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const s = sanitizeAccent(c, "");
    const hex = s ? normalizeHex(s) : null;
    if (hex) return hex;
  }
  return THEME_DEFAULT_ACCENT[name];
}

export function resolveTheme(o: ThemeOptions): ResolvedTheme {
  const name = asTheme(o.theme) ?? asTheme(o.modelTheme) ?? "minimal";
  const shape = THEME_SHAPE[name];
  const mode: Mode = o.mode === "light" || o.mode === "dark" ? o.mode : shape.prefersDark ? "dark" : "light";
  const colors = THEME_COLORS[name][mode];

  const densityKey = (o.density === "auto" ? shape.defaultDensity : o.density) as DensityKey;
  const density = DENSITY_SCALE[densityKey] ?? DENSITY_SCALE.cozy;

  const roundKey = o.roundness === "auto" ? shape.radius : ROUNDNESS_MAP[o.roundness] ?? shape.radius;
  const radius = RADIUS_SCALE[roundKey] ?? RADIUS_SCALE.lg;

  const widthKey = (o.contentWidth === "auto" ? shape.defaultWidth : o.contentWidth) as WidthKey;
  const width = WIDTH_SCALE[widthKey] ?? WIDTH_SCALE.standard;

  const fontKey = (o.fontPairing === "auto" ? shape.defaultFont : o.fontPairing) as FontKey;
  const font = FONT_PAIRINGS[fontKey] ?? FONT_PAIRINGS.system;

  const accent = resolveAccent(o, name);

  return {
    name,
    mode,
    colors,
    shape,
    density,
    radius,
    width,
    font,
    accent,
    accentMix: darken(accent, 0.18),
    ctaText: ctaTextColor(accent),
  };
}
