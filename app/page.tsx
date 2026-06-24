import { getLocale } from "@/lib/i18n-server";
import { ScrollFX } from "@/components/scroll-fx";
import { SpiralThread } from "@/components/spiral-thread";
import SiteNav from "@/components/landing/site-nav";
import Hero from "@/components/landing/hero";
import ModelRig from "@/components/landing/model-rig";
import Examples from "@/components/landing/examples";
import BeforeAfterSection from "@/components/landing/before-after-section";
import Industries from "@/components/landing/industries";
import Reel from "@/components/landing/reel";
import InputOutput from "@/components/landing/input-output";
import Modules from "@/components/landing/modules";
import WhyDifferent from "@/components/landing/why-different";
import HowItWorks from "@/components/landing/how-it-works";
import Pricing from "@/components/landing/pricing";
import Faq from "@/components/landing/faq";
import FinalCta from "@/components/landing/final-cta";
import Footer from "@/components/landing/footer";

export default async function Home() {
  const locale = await getLocale();

  return (
    <>
      {/* Ambient backdrop — reduced-motion fallback (hidden behind the opaque spiral for motion users) */}
      <div className="aurora" aria-hidden>
        <div className="aurora__blob aurora__blob--v" />
        <div className="aurora__blob aurora__blob--i" />
        <div className="aurora__blob aurora__blob--s" />
      </div>
      {/* 3D glowing helix behind the content — glows through the page as it descends */}
      <SpiralThread mode={2} />
      <div className="grain" aria-hidden />
      {/* Readability scrim over the spiral (behind content) — a base veil so text
          stays legible over the glow, deepening into a vignette at the edges. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(125%_125%_at_50%_40%,rgba(6,7,12,0.36),rgba(2,3,6,0.72))]"
      />
      <ScrollFX />

      <SiteNav locale={locale} />

      <main className="relative z-10 w-full flex-1">
        <Hero locale={locale} />
        <ModelRig locale={locale} />
        <Examples locale={locale} />
        <BeforeAfterSection locale={locale} />
        <Industries locale={locale} />
        <Reel locale={locale} />
        <InputOutput locale={locale} />
        <Modules locale={locale} />
        <WhyDifferent locale={locale} />
        <HowItWorks locale={locale} />
        <Pricing locale={locale} />
        <Faq locale={locale} />
        <FinalCta locale={locale} />
      </main>

      <div className="relative z-10">
        <Footer locale={locale} />
      </div>
    </>
  );
}
