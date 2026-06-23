import { getLocale } from "@/lib/i18n-server";
import SiteNav from "@/components/landing/site-nav";
import Hero from "@/components/landing/hero";
import ModelRig from "@/components/landing/model-rig";
import Primeri from "@/components/landing/primeri";
import PrePosle from "@/components/landing/pre-posle";
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
      {/* Ambient backdrop — fixed behind everything; pure-CSS motion, gated by prefers-reduced-motion */}
      <div className="aurora" aria-hidden>
        <div className="aurora__blob aurora__blob--v" />
        <div className="aurora__blob aurora__blob--i" />
        <div className="aurora__blob aurora__blob--s" />
      </div>
      <div className="grain" aria-hidden />

      <SiteNav locale={locale} />

      <main className="w-full flex-1">
        <Hero locale={locale} />
        <ModelRig locale={locale} />
        <Primeri locale={locale} />
        <PrePosle locale={locale} />
        <InputOutput locale={locale} />
        <Modules locale={locale} />
        <WhyDifferent locale={locale} />
        <HowItWorks locale={locale} />
        <Pricing locale={locale} />
        <Faq locale={locale} />
        <FinalCta locale={locale} />
      </main>

      <Footer locale={locale} />
    </>
  );
}
