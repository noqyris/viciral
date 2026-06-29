import { getCurrentUser } from "@/lib/auth";
import { getActiveOrg } from "@/lib/active-org";
import { colorsToStrings } from "@/lib/brand/inject";
import { referenceImagesToStrings } from "@/lib/brand/normalize";
import { getLocale } from "@/lib/i18n-server";
import { updateBrandIdentity } from "./brand-actions";

export const dynamic = "force-dynamic";

const T = {
  sr: {
    eyebrow: "Brend",
    title: "Identitet brenda",
    sub: "Boje, ton, logo i reference se ubacuju u svaku generaciju ovog brenda — vizuelna doslednost je moat.",
    name: "Ime brenda",
    voice: "Ton / glas",
    voicePh: "npr. topao, premium, samouveren",
    colors: "Boje (paleta)",
    colorsHint: "#hex, razdvojeno zarezom",
    logo: "Logo (URL)",
    refs: "Reference (slike lika/proizvoda)",
    refsHint: "jedan URL po liniji",
    notes: "Napomene",
    notesPh: "Šta da modeli imaju na umu o brendu…",
    save: "Sačuvaj brend",
    currentLogo: "Trenutni logo",
  },
  en: {
    eyebrow: "Brand",
    title: "Brand identity",
    sub: "Colors, tone, logo and references are injected into every generation for this brand — visual consistency is the moat.",
    name: "Brand name",
    voice: "Tone / voice",
    voicePh: "e.g. warm, premium, confident",
    colors: "Colors (palette)",
    colorsHint: "#hex, comma-separated",
    logo: "Logo (URL)",
    refs: "References (character/product images)",
    refsHint: "one URL per line",
    notes: "Notes",
    notesPh: "What the models should keep in mind about the brand…",
    save: "Save brand",
    currentLogo: "Current logo",
  },
} as const;

export default async function BrandPage() {
  const locale = await getLocale();
  const t = T[locale];
  const user = await getCurrentUser();
  const org = await getActiveOrg(user.id);

  const colors = colorsToStrings(org.colors);
  const colorsValue = colors.join(", ");
  const refsValue = referenceImagesToStrings(org.referenceImages).join("\n");

  return (
    <main className="relative mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(99,102,241,0.12),transparent_70%)]"
      />
      <header className="relative mb-8">
        <p className="eyebrow">
          <span aria-hidden className="size-1.5 rounded-full bg-violet-400" />
          {t.eyebrow} · {org.name}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">{t.title}</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-zinc-400">{t.sub}</p>
      </header>

      <form action={updateBrandIdentity} className="card card-frost relative space-y-5 rounded-2xl p-6 sm:p-7">
        <label className="block">
          <span className="field-label">{t.name}</span>
          <input name="name" defaultValue={org.name} required minLength={2} className="mt-1 field" />
        </label>

        <label className="block">
          <span className="field-label">{t.voice}</span>
          <input name="voice" defaultValue={org.voice ?? ""} placeholder={t.voicePh} className="mt-1 field" />
        </label>

        <label className="block">
          <span className="flex items-center justify-between">
            <span className="field-label">{t.colors}</span>
            <span className="text-[11px] text-zinc-500">{t.colorsHint}</span>
          </span>
          <input name="colors" defaultValue={colorsValue} placeholder="#a78bfa, #6366f1, #38bdf8" className="mt-1 field" />
          {colors.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {colors.map((c) => (
                <span
                  key={c}
                  title={c}
                  className="size-6 rounded-md ring-1 ring-inset ring-white/15"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
          )}
        </label>

        <label className="block">
          <span className="field-label">{t.logo}</span>
          <input name="logoUrl" defaultValue={org.logoUrl ?? ""} placeholder="https://…/logo.png" className="mt-1 field" />
        </label>
        {org.logoUrl && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">{t.currentLogo}</span>
            <span className="grid size-12 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={org.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
            </span>
          </div>
        )}

        <label className="block">
          <span className="flex items-center justify-between">
            <span className="field-label">{t.refs}</span>
            <span className="text-[11px] text-zinc-500">{t.refsHint}</span>
          </span>
          <textarea name="referenceImages" defaultValue={refsValue} rows={3} placeholder="https://…/portrait.png" className="mt-1 field" />
        </label>

        <label className="block">
          <span className="field-label">{t.notes}</span>
          <textarea name="notes" defaultValue={org.notes ?? ""} rows={3} placeholder={t.notesPh} className="mt-1 field" />
        </label>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_rgba(139,92,246,0.7)] transition-all hover:from-violet-400 hover:to-indigo-400 sm:w-auto"
        >
          {t.save}
        </button>
      </form>
    </main>
  );
}
