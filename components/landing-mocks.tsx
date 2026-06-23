import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  BadgeCheck,
  Play,
  Volume2,
  Music,
  Plus,
  Lock,
  Flame,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";

const FRAME =
  "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_30px_90px_-40px_rgba(139,92,246,0.75)]";

const T = {
  sr: {
    postAlt: "Primer objave",
    postUser: "lunar.coffee",
    postLoc: "Beograd, Srbija",
    likes: "1.247 sviđanja",
    postCaption: "Nova kolekcija je stigla ☕ Limitirana serija — ne propusti.",
    tags: "#novakolekcija #kafa #specialty #beograd",
    comments: "Prikaži svih 23 komentara",
    time: "pre 2 sata",
    videoAlt: "Primer cinematic videa",
    videoTitle: "Lunar Coffee — cinematic",
    follow: "Prati",
    share: "Podeli",
    sound: "originalni zvuk · lunar.coffee",
    siteAlt: "Primer sajta",
    order: "Poruči",
    secure: "lunarcoffee.rs",
    brandAlt: "Primer brend table",
    brandLabel: "Brend tabla",
    tone: "Ton: topao, samouveren",
    tagline: "Tvoj trenutak mira.",
  },
  en: {
    postAlt: "Post example",
    postUser: "lunar.coffee",
    postLoc: "Belgrade, Serbia",
    likes: "1,247 likes",
    postCaption: "The new collection just dropped ☕ Limited run — don't miss it.",
    tags: "#newdrop #coffee #specialty #belgrade",
    comments: "View all 23 comments",
    time: "2 hours ago",
    videoAlt: "Cinematic video example",
    videoTitle: "Lunar Coffee — cinematic",
    follow: "Follow",
    share: "Share",
    sound: "original sound · lunar.coffee",
    siteAlt: "Website example",
    order: "Order",
    secure: "lunarcoffee.rs",
    brandAlt: "Brand board example",
    brandLabel: "Brand board",
    tone: "Tone: warm, confident",
    tagline: "Your moment of calm.",
  },
} as const;

/** Small gradient avatar with an initial — used across the mocks. */
function Avatar({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs";
  return (
    <span
      className={`grid ${box} shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 font-semibold text-white ring-2 ring-white/15`}
    >
      L
    </span>
  );
}

/** Instagram-style post wrapping the real generated image. */
export function PostMock({ locale }: { locale: Locale }) {
  const t = T[locale];
  return (
    <div className={`mx-auto w-full max-w-sm ${FRAME}`}>
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <Avatar />
        <div className="leading-tight">
          <div className="flex items-center gap-1 text-sm font-semibold text-zinc-100">
            {t.postUser}
            <BadgeCheck className="h-3.5 w-3.5 text-sky-400" strokeWidth={2} aria-hidden />
          </div>
          <div className="text-xs text-zinc-400">{t.postLoc}</div>
        </div>
        <MoreHorizontal className="ml-auto h-5 w-5 text-zinc-400" aria-hidden />
      </div>

      <div className="relative aspect-square">
        <Image src="/examples/social.png" alt={t.postAlt} fill sizes="384px" className="object-cover" />
      </div>

      <div className="space-y-2 px-3.5 py-3">
        <div className="flex items-center gap-4 text-zinc-100">
          <Heart className="h-6 w-6" strokeWidth={1.8} aria-hidden />
          <MessageCircle className="h-6 w-6 -scale-x-100" strokeWidth={1.8} aria-hidden />
          <Send className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
          <Bookmark className="ml-auto h-6 w-6" strokeWidth={1.8} aria-hidden />
        </div>
        <div className="text-sm font-semibold text-zinc-100">{t.likes}</div>
        <p className="text-sm text-zinc-200">
          <span className="font-semibold">{t.postUser}</span> {t.postCaption}
        </p>
        <p className="text-sm text-sky-300/90">{t.tags}</p>
        <p className="text-sm text-zinc-500">{t.comments}</p>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">{t.time}</p>
      </div>
    </div>
  );
}

/** 16:9 cinematic player with a realistic control bar. */
export function VideoMock({ src, alt }: { src: string; alt?: string }) {
  const t = T.sr; // labels here are visual-only; locale-agnostic glyphs
  return (
    <div className={`relative aspect-video w-full ${FRAME}`}>
      <Image src={src} alt={alt ?? t.videoAlt} fill sizes="(min-width: 768px) 32rem, 100vw" className="object-cover" />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />

      <span className="absolute right-3 top-3 rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white backdrop-blur-sm ring-1 ring-white/25">
        HD
      </span>

      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 text-white shadow-2xl ring-1 ring-white/30 backdrop-blur-md">
          <Play className="ml-0.5 h-7 w-7 fill-white" strokeWidth={0} aria-hidden />
        </span>
      </div>

      <div className="absolute inset-x-3 bottom-3">
        <div className="mb-2 text-sm font-semibold text-white drop-shadow">{T.sr.videoTitle}</div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-400 to-sky-400" />
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] font-medium text-white/90">
          <span>0:03 / 0:10</span>
          <Volume2 className="ml-auto h-4 w-4" strokeWidth={2} aria-hidden />
        </div>
      </div>
    </div>
  );
}

/** 9:16 vertical clip with a TikTok-style action rail. */
export function VerticalMock({
  src,
  alt,
  caption,
  score,
  locale = "sr",
}: {
  src: string;
  alt: string;
  caption: string;
  score?: number;
  locale?: Locale;
}) {
  const t = T[locale];
  return (
    <div className={`relative mx-auto aspect-[9/16] w-full max-w-[244px] ${FRAME}`}>
      <Image src={src} alt={alt} fill sizes="244px" className="object-cover" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {score != null && (
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-violet-500/90 px-2 py-0.5 text-xs font-bold text-white shadow-lg ring-1 ring-white/20">
          <Flame className="h-3.5 w-3.5 fill-white" strokeWidth={0} aria-hidden /> {score}
        </span>
      )}

      {/* Right action rail */}
      <div className="absolute bottom-3 right-2 flex flex-col items-center gap-4 text-white">
        <span className="relative mb-1">
          <Avatar size="sm" />
          <span className="absolute -bottom-1.5 left-1/2 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full bg-rose-500 ring-2 ring-black/30">
            <Plus className="h-3 w-3" strokeWidth={3} aria-hidden />
          </span>
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <Heart className="h-7 w-7 fill-white" strokeWidth={0} aria-hidden />
          <span className="text-[11px] font-semibold">12.4k</span>
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <MessageCircle className="h-7 w-7 fill-white text-black" strokeWidth={0} aria-hidden />
          <span className="text-[11px] font-semibold">318</span>
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <Bookmark className="h-6 w-6 fill-white" strokeWidth={0} aria-hidden />
          <span className="text-[11px] font-semibold">1.2k</span>
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <Send className="h-6 w-6" strokeWidth={2} aria-hidden />
          <span className="text-[11px] font-semibold">{t.share}</span>
        </span>
      </div>

      {/* Bottom-left meta */}
      <div className="absolute inset-x-3 bottom-3 max-w-[78%] space-y-1.5 text-white">
        <div className="text-sm font-bold drop-shadow">@{t.postUser}</div>
        <p className="text-[13px] font-medium leading-snug drop-shadow">{caption}</p>
        <div className="flex items-center gap-1.5 text-[11px]">
          <Music className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span className="truncate">{t.sound}</span>
        </div>
      </div>
    </div>
  );
}

/** Browser window framing the real hero image. */
export function BrowserMock({ locale }: { locale: Locale }) {
  const t = T[locale];
  return (
    <div className={`w-full ${FRAME}`}>
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 flex flex-1 items-center gap-1.5 rounded-md bg-white/5 px-3 py-1 text-xs text-zinc-400">
          <Lock className="h-3 w-3 text-emerald-400" strokeWidth={2.4} aria-hidden />
          {t.secure}
        </span>
      </div>
      <div className="relative aspect-[16/10]">
        <Image src="/examples/website.png" alt={t.siteAlt} fill sizes="(min-width: 768px) 32rem, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4">
          <div className="text-xl font-bold text-white drop-shadow">Lunar Coffee</div>
          <span className="mt-2 inline-block rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-900 shadow-lg">
            {t.order} →
          </span>
        </div>
      </div>
    </div>
  );
}

/** Brand board: logo lockup + palette + voice. */
export function BrandMock({ locale }: { locale: Locale }) {
  const t = T[locale];
  const palette = [
    { c: "#0f0f17", n: "Ink" },
    { c: "#8b5cf6", n: "Violet" },
    { c: "#f5f0e6", n: "Cream" },
    { c: "#c2410c", n: "Roast" },
  ];
  return (
    <div className={`w-full p-5 ${FRAME}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-300 ring-1 ring-white/10">
          {t.brandLabel}
        </span>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400 ring-1 ring-white/10">
          {t.tone}
        </span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
        <Image src="/examples/brand.png" alt={t.brandAlt} fill sizes="(min-width: 768px) 32rem, 100vw" className="object-cover" />
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        {palette.map((p) => (
          <span key={p.c} className="flex flex-col items-center gap-1">
            <span className="h-8 w-8 rounded-lg ring-1 ring-white/10" style={{ backgroundColor: p.c }} />
            <span className="text-[9px] uppercase tracking-wide text-zinc-500">{p.n}</span>
          </span>
        ))}
        <span className="ml-auto text-right">
          <span className="block font-semibold text-zinc-100">Lunar Coffee</span>
          <span className="text-sm text-zinc-400">&bdquo;{t.tagline}&ldquo;</span>
        </span>
      </div>
    </div>
  );
}
