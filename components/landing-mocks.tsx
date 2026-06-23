import Image from "next/image";
import type { Locale } from "@/lib/i18n";

const FRAME = "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_20px_70px_-30px_rgba(139,92,246,0.7)]";

const T = {
  sr: {
    postAlt: "Primer objave",
    postCaption: "Nova kolekcija je stigla 🔥 Limitirana serija — ne propusti.",
    siteAlt: "Primer sajta",
    order: "Poruči →",
    brandAlt: "Primer logoa",
    tone: "Ton: topao, samouveren",
    tagline: "Tvoj trenutak mira.",
  },
  en: {
    postAlt: "Post example",
    postCaption: "The new collection just dropped 🔥 Limited run — don't miss it.",
    siteAlt: "Website example",
    order: "Order →",
    brandAlt: "Logo example",
    tone: "Tone: warm, confident",
    tagline: "Your moment of calm.",
  },
} as const;

/** Instagram-style post with the real generated image. */
export function PostMock({ locale }: { locale: Locale }) {
  const t = T[locale];
  return (
    <div className={`mx-auto w-full max-w-sm ${FRAME}`}>
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-xs">
          ☕
        </span>
        <span className="text-sm font-semibold text-zinc-100">lunar.coffee</span>
        <span className="ml-auto text-zinc-500">···</span>
      </div>
      <div className="relative aspect-square">
        <Image src="/examples/social.png" alt={t.postAlt} fill sizes="384px" className="object-cover" />
      </div>
      <div className="space-y-1.5 px-4 py-3">
        <div className="flex gap-3 text-lg text-zinc-300">
          <span>♥</span>
          <span>💬</span>
          <span>➤</span>
        </div>
        <p className="text-sm text-zinc-200">
          {t.postCaption}
        </p>
        <p className="text-sm text-violet-300">#novakolekcija #patike #style #limited</p>
      </div>
    </div>
  );
}

/** 16:9 video player frame. */
export function VideoMock({ src, alt }: { src: string; alt: string }) {
  return (
    <div className={`relative aspect-video w-full ${FRAME}`}>
      <Image src={src} alt={alt} fill sizes="(min-width: 768px) 32rem, 100vw" className="object-cover" />
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/15 text-xl text-white backdrop-blur-md ring-1 ring-white/30">
          ▶
        </span>
      </div>
      <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
        0:10 · 🔊
      </span>
    </div>
  );
}

/** 9:16 vertical clip with caption (and optional viral score). */
export function VerticalMock({
  src,
  alt,
  caption,
  score,
}: {
  src: string;
  alt: string;
  caption: string;
  score?: number;
}) {
  return (
    <div className={`relative mx-auto aspect-[9/16] w-full max-w-[240px] ${FRAME}`}>
      <Image src={src} alt={alt} fill sizes="240px" className="object-cover" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 to-transparent" />
      {score != null && (
        <span className="absolute right-2 top-2 rounded-full bg-violet-500/90 px-2 py-0.5 text-xs font-semibold text-white shadow-lg">
          🔥 {score}
        </span>
      )}
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-lg text-white backdrop-blur-md ring-1 ring-white/30">
          ▶
        </span>
      </div>
      <p className="absolute inset-x-3 bottom-3 text-center text-sm font-bold leading-tight text-white drop-shadow">
        {caption}
      </p>
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
        <span className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-zinc-400">
          lunarcoffee.rs
        </span>
      </div>
      <div className="relative aspect-[16/10]">
        <Image src="/examples/website.png" alt={t.siteAlt} fill sizes="(min-width: 768px) 32rem, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <div className="text-lg font-bold text-white drop-shadow">Lunar Coffee</div>
          <span className="mt-1 inline-block rounded-lg bg-white px-3 py-1 text-xs font-semibold text-zinc-900">
            {t.order}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Brand board: logo + palette + voice. */
export function BrandMock({ locale }: { locale: Locale }) {
  const t = T[locale];
  const palette = ["#0f0f17", "#8b5cf6", "#f5f0e6", "#c2410c"];
  return (
    <div className={`w-full p-5 ${FRAME}`}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
        <Image src="/examples/brand.png" alt={t.brandAlt} fill sizes="(min-width: 768px) 32rem, 100vw" className="object-cover" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        {palette.map((c) => (
          <span key={c} className="h-7 w-7 rounded-lg ring-1 ring-white/10" style={{ backgroundColor: c }} />
        ))}
        <span className="ml-auto rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-300">
          {t.tone}
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-300">
        <span className="font-semibold text-zinc-100">Lunar Coffee</span> &mdash; &bdquo;{t.tagline}&ldquo;
      </p>
    </div>
  );
}
