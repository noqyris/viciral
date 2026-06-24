import { getLocale } from "@/lib/i18n-server";
import { ScrollFX } from "@/components/scroll-fx";
import { SpiralController } from "@/components/spiral-controller";
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
      {/* 3D glowing helix + on-page prominence switcher (1 Subtle / 2 Bold / 3 Max) */}
      <SpiralController />
      <div className="grain" aria-hidden />
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
