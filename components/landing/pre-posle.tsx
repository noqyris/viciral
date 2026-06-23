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
    sub: "Ista scena — levo sirov materijal, desno ono što Viciral napravi. Prevuci ručicu na svakom primeru.",
    hint: "Prevuci",
    items: [
      {
        slug: "website",
        src: "/examples/website.png",
        alt: "Pre i posle: sajt napravljen Viciral-om",
        prompt: "opis: sajt za specialty kafu, topla i moderna estetika",
        module: "Website Builder",
      },
      {
        slug: "social-pack",
        src: "/examples/social.png",
        alt: "Pre i posle: objava za društvene mreže",
        prompt: "tema: lansiranje nove kolekcije kafe",
        module: "Social Media Paket",
      },
      {
        slug: "cinematic",
        src: "/examples/cinematic.png",
        alt: "Pre i posle: cinematic kadar",
        prompt: "kadar: šoljica na drvenom stolu, topla svetlost, spori zoom",
        module: "Cinematic Video",
      },
      {
        slug: "brand-kit",
        src: "/examples/brand.png",
        alt: "Pre i posle: brend tabla",
        prompt: "brend: topla, samouverena kafa — ton, paleta, logo",
        module: "Brand Kit",
      },
    ],
  },
  en: {
    eyebrow: "BEFORE / AFTER",
    headA: "Drag to see the ",
    headHi: "difference",
    headB: ".",
    sub: "Same scene — raw on the left, what Viciral makes on the right. Drag the handle on each example.",
    hint: "Drag",
    items: [
      {
        slug: "website",
        src: "/examples/website.png",
        alt: "Before and after: a website made with Viciral",
        prompt: "brief: a specialty-coffee site, warm and modern",
        module: "Website Builder",
      },
      {
        slug: "social-pack",
        src: "/examples/social.png",
        alt: "Before and after: a social media post",
        prompt: "topic: launching a new coffee collection",
        module: "Social Media Pack",
      },
      {
        slug: "cinematic",
        src: "/examples/cinematic.png",
        alt: "Before and after: a cinematic frame",
        prompt: "shot: a cup on a wooden table, warm light, slow zoom",
        module: "Cinematic Video",
      },
      {
        slug: "brand-kit",
        src: "/examples/brand.png",
        alt: "Before and after: a brand board",
        prompt: "brand: warm, confident coffee — voice, palette, logo",
        module: "Brand Kit",
      },
    ],
  },
} as const;

export default function PrePosle({ locale }: { locale: Locale }) {
  const t = T[locale];

  return (
    <section id="pre-posle" aria-labelledby="pre-posle-heading" className="section section-pit relative scroll-mt-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal dir="up">
          <p className="eyebrow">
            <MoveHorizontal aria-hidden className="h-3.5 w-3.5" />
            {t.eyebrow}
          </p>
          <h2 id="pre-posle-heading" className="h2-fluid mt-4 max-w-3xl text-white">
            {t.headA}
            <span className="gradient-text">{t.headHi}</span>
            {t.headB}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-zinc-400">
            {t.sub}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-7 sm:grid-cols-2">
          {t.items.map((it, i) => (
            <Reveal key={it.slug} dir="up" delay={(i % 2) * 90}>
              <BeforeAfter
                src={it.src}
                alt={it.alt}
                prompt={it.prompt}
                moduleLabel={it.module}
                slug={it.slug}
                locale={locale}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
