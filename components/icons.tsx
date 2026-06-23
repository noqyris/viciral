import {
  Sparkles,
  Clapperboard,
  Palette,
  Globe,
  WandSparkles,
  Scissors,
  PenTool,
  Speech,
  Music,
  Languages,
  LayoutGrid,
  LayoutTemplate,
  Calendar,
  History,
  Link2,
  Rocket,
  Lightbulb,
  Video,
  FileText,
  ShoppingBag,
  Megaphone,
  GraduationCap,
  Mic2,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import type { ReactElement } from "react";

/**
 * Central icon system. Every surface renders professional line icons through
 * these maps instead of ad-hoc emoji, so the whole app stays visually
 * consistent and "adding a module/template/platform" only touches one map.
 *
 * lucide icons are pure SVG components (no client hooks) so they render in both
 * server and client components.
 */

// ---- Modules (keyed by slug) ----
const MODULE_ICONS: Record<string, LucideIcon> = {
  "social-pack": Sparkles,
  cinematic: Clapperboard,
  "brand-kit": Palette,
  website: Globe,
  "image-tools": WandSparkles,
  "short-form": Scissors,
  editor: PenTool,
  avatar: Speech,
  dubbing: Languages,
  music: Music,
};

export function ModuleIcon({
  slug,
  className,
  strokeWidth = 1.75,
}: {
  slug: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = MODULE_ICONS[slug] ?? Sparkles;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

// ---- Studio nav (keyed by nav id) ----
const NAV_ICONS: Record<string, LucideIcon> = {
  studio: LayoutGrid,
  templates: LayoutTemplate,
  calendar: Calendar,
  history: History,
  brands: Palette,
  connections: Link2,
};

export function NavIcon({
  id,
  className,
  strokeWidth = 1.75,
}: {
  id: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = NAV_ICONS[id] ?? LayoutGrid;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

// ---- Templates (keyed by a semantic icon key on each template) ----
const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket,
  lightbulb: Lightbulb,
  film: Video,
  file: FileText,
  store: ShoppingBag,
  megaphone: Megaphone,
  teacher: GraduationCap,
  mic: Mic2,
  phone: Smartphone,
  scissors: Scissors,
  music: Music,
  translate: Languages,
};

export function TemplateIcon({
  name,
  className,
  strokeWidth = 1.75,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = TEMPLATE_ICONS[name] ?? Sparkles;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

// ---- Social platforms (brand glyphs — lucide ships no brand logos) ----
type GlyphProps = { className?: string };

function InstagramGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} aria-hidden>
      <path d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.5c-1.3.05-2.5-.3-3.6-.95v5.6c0 2.9-2.1 5.1-5 5.1S6.4 17 6.4 14.2c0-2.7 2-4.9 4.7-5v2.6c-1.2.1-2.1 1.1-2.1 2.4 0 1.4 1 2.4 2.3 2.4 1.3 0 2.3-1 2.3-2.6V3h2.9Z" />
    </svg>
  );
}

function LinkedInGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} aria-hidden>
      <path d="M4.98 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3.3 8.9h3.36V21H3.3V8.9Zm5.5 0h3.22v1.65h.05c.45-.85 1.55-1.75 3.2-1.75 3.42 0 4.05 2.25 4.05 5.18V21h-3.36v-5.36c0-1.28-.02-2.92-1.78-2.92-1.78 0-2.05 1.39-2.05 2.83V21H8.8V8.9Z" />
    </svg>
  );
}

function FacebookGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<string, (props: GlyphProps) => ReactElement> = {
  instagram: InstagramGlyph,
  tiktok: TikTokGlyph,
  linkedin: LinkedInGlyph,
  facebook: FacebookGlyph,
};

export function PlatformIcon({ id, className }: { id: string; className?: string }) {
  const Glyph = PLATFORM_ICONS[id];
  if (!Glyph) return <Globe className={className} aria-hidden />;
  return <Glyph className={className} />;
}

// ---- Google "G" (auth) ----
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.27a12 12 0 0 0 0 10.76l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.13 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
