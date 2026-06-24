import { MoveHorizontal } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { BeforeAfter } from "@/components/landing/before-after";
import type { Locale } from "@/lib/i18n";

const T = {
  sr: {
    eyebrow: "PRE / POSLE",
    headA: "Prevuci i vidi ",
    headHi: "razliku",
    headB: ".",
    sub: "Sirov materijal levo, gotov rad desno — prevuci ručicu na svakom primeru. Svaki rad je napravljen ovim alatom.",
    website: { module: "Website Builder", prompt: "opis: sajt za specialty kafu, topla i moderna estetika", alt: "Pre i posle: od wireframe-a do gotovog sajta" },
    social: { module: "Social Media Paket", prompt: "tema: lansiranje nove kolekcije patika", alt: "Pre i posle: od amaterske fotke do studijske objave" },
    brand: { module: "Brand Kit", prompt: "brend: Lunar — elegantno, mistično (logo, paleta, ton)", alt: "Pre i posle: od beležaka do gotovog logoa" },
    avatar: { module: "Avatar / Presenter", prompt: "portret: profesionalni prezenter, studijsko svetlo", alt: "Pre i posle: od selfija do profesionalnog prezentera" },
    shortform: { module: "Short-Form Klipovi", prompt: "klip: vertikalni reels sa natpisima", alt: "Pre i posle: od sirovog snimka do gotovog klipa" },
  },
  en: {
    eyebrow: "BEFORE / AFTER",
    headA: "Drag to see the ",
    headHi: "difference",
    headB: ".",
    sub: "Raw material on the left, finished work on the right — drag the handle on each. Every piece was made with this tool.",
    website: { module: "Website Builder", prompt: "brief: a specialty-coffee site, warm and modern", alt: "Before and after: from wireframe to finished site" },
    social: { module: "Social Media Pack", prompt: "topic: launching a new sneaker collection", alt: "Before and after: from amateur snap to studio post" },
    brand: { module: "Brand Kit", prompt: "brand: Lunar — elegant, mysterious (logo, palette, voice)", alt: "Before and after: from notes to a finished logo" },
    avatar: { module: "Avatar / Presenter", prompt: "portrait: a professional presenter, studio light", alt: "Before and after: from a selfie to a pro presenter" },
    shortform: { module: "Short-Form Clips", prompt: "clip: a vertical reel with captions", alt: "Before and after: from raw footage to a finished clip" },
  },
} as const;

export default function BeforeAfterSection({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section id="before-after" aria-labelledby="before-after-heading" className="section section-pit relative scroll-mt-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal dir="up">
          <p className="eyebrow">
            <MoveHorizontal aria-hidden className="h-3.5 w-3.5" />
            {t.eyebrow}
          </p>
          <h2 id="before-after-heading" className="h2-fluid mt-4 max-w-3xl text-white">
            {t.headA}
            <span className="gradient-text">{t.headHi}</span>
            {t.headB}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-zinc-400">
            {t.sub}
          </p>
        </Reveal>

        <div className="mt-12 space-y-8">
          {/* Hero — wireframe → finished site (wide) */}
          <div data-fx="assemble" data-i={0}>
            <BeforeAfter
              src="/examples/website.png"
              beforeSrc="/examples/website-before.png"
              alt={t.website.alt}
              prompt={t.website.prompt}
              moduleLabel={t.website.module}
              slug="website"
              aspect="7 / 4"
              sizes="(min-width: 768px) 60rem, 100vw"
              locale={locale}
            />
          </div>

          {/* Squares — social + brand */}
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
            <div data-fx="assemble" data-i={1}>
              <BeforeAfter
                src="/examples/social.png"
                beforeSrc="/examples/social-before.png"
                alt={t.social.alt}
                prompt={t.social.prompt}
                moduleLabel={t.social.module}
                slug="social-pack"
                aspect="1 / 1"
                sizes="(min-width: 768px) 28rem, 100vw"
                locale={locale}
              />
            </div>
            <div data-fx="assemble" data-i={2}>
              <BeforeAfter
                src="/examples/brand.png"
                beforeSrc="/examples/brand-before.png"
                alt={t.brand.alt}
                prompt={t.brand.prompt}
                moduleLabel={t.brand.module}
                slug="brand-kit"
                aspect="1 / 1"
                sizes="(min-width: 768px) 28rem, 100vw"
                locale={locale}
              />
            </div>
          </div>

          {/* Portraits — avatar + short-form */}
          <div className="flex flex-wrap justify-center gap-8">
            <div data-fx="assemble" data-i={3} className="w-full max-w-[290px]">
              <BeforeAfter
                src="/examples/avatar.png"
                beforeSrc="/examples/avatar-before.png"
                alt={t.avatar.alt}
                prompt={t.avatar.prompt}
                moduleLabel={t.avatar.module}
                slug="avatar"
                aspect="4 / 7"
                sizes="290px"
                locale={locale}
              />
            </div>
            <div data-fx="assemble" data-i={4} className="w-full max-w-[290px]">
              <BeforeAfter
                src="/examples/shortform.png"
                beforeSrc="/examples/shortform-before.png"
                alt={t.shortform.alt}
                prompt={t.shortform.prompt}
                moduleLabel={t.shortform.module}
                slug="short-form"
                aspect="4 / 7"
                sizes="290px"
                locale={locale}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
