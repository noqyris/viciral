"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-context";
import { colorsToStrings } from "@/lib/brand/inject";
import { referenceImagesToStrings } from "@/lib/brand/normalize";

const T = {
  sr: {
    newBrand: "Novi brend",
    namePlaceholder: "Naziv brenda",
    voicePlaceholder: "Ton glasa (npr. duhovit, direktan)",
    colorsPlaceholder: "Boje, zarezom (#111, #f5f5f5)",
    notesPlaceholder: "Napomene (npr. izbegavaj emotikone)",
    referencesLabel: "Reference (URL slika lica / proizvoda / maskote)",
    referencesHint:
      "Po jedan URL u redu. Ubacuju se u svaku generaciju radi vizuelne doslednosti.",
    setDefault: "Postavi kao podrazumevani",
    saving: "Čuvam…",
    saveBrand: "Sačuvaj brend",
    emptyPrefix: "Još nemaš nijedan brend. Dodaj ga gore, ili ga generiši u",
    emptySuffix: "modulu.",
    defaultBadge: "Podrazumevani",
    voiceLabel: "Ton:",
    colorsLabel: "Boje:",
    referenceListLabel: "Reference:",
    referenceAlt: "Referenca",
    makeDefault: "Podrazumevani",
    delete: "Obriši",
    genericError: "Greška",
  },
  en: {
    newBrand: "New brand",
    namePlaceholder: "Brand name",
    voicePlaceholder: "Tone of voice (e.g. witty, direct)",
    colorsPlaceholder: "Colors, comma-separated (#111, #f5f5f5)",
    notesPlaceholder: "Notes (e.g. avoid emojis)",
    referencesLabel: "References (image URLs of face / product / mascot)",
    referencesHint:
      "One URL per line. They're injected into every generation for visual consistency.",
    setDefault: "Set as default",
    saving: "Saving…",
    saveBrand: "Save brand",
    emptyPrefix: "You don't have any brands yet. Add one above, or generate one in the",
    emptySuffix: "module.",
    defaultBadge: "Default",
    voiceLabel: "Tone:",
    colorsLabel: "Colors:",
    referenceListLabel: "References:",
    referenceAlt: "Reference",
    makeDefault: "Make default",
    delete: "Delete",
    genericError: "Error",
  },
} as const;

export interface BrandView {
  id: string;
  name: string;
  voice: string | null;
  notes: string | null;
  colors: string[];
  referenceImages: string[];
  isDefault: boolean;
}

interface RawBrand {
  id: string;
  name: string;
  voice: string | null;
  notes: string | null;
  colors: unknown;
  referenceImages: unknown;
  isDefault: boolean;
}

function normalize(b: RawBrand): BrandView {
  return {
    id: b.id,
    name: b.name,
    voice: b.voice,
    notes: b.notes,
    // Shared, unit-tested normalization — keeps client list identical to SSR.
    colors: colorsToStrings(b.colors),
    referenceImages: referenceImagesToStrings(b.referenceImages),
    isDefault: b.isDefault,
  };
}

export function BrandManager({ initial }: { initial: BrandView[] }) {
  const t = T[useLocale()];
  const [brands, setBrands] = useState<BrandView[]>(initial);
  const [name, setName] = useState("");
  const [voice, setVoice] = useState("");
  const [colors, setColors] = useState("");
  const [notes, setNotes] = useState("");
  const [references, setReferences] = useState("");
  const [isDefault, setIsDefault] = useState(initial.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/brands");
    const data = (await res.json()) as { brands?: RawBrand[] };
    setBrands((data.brands ?? []).map(normalize));
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          voice: voice || undefined,
          notes: notes || undefined,
          colors: colors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          referenceImages: references
            .split(/[\n,]/)
            .map((u) => u.trim())
            .filter(Boolean),
          isDefault,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t.genericError);
      setName("");
      setVoice("");
      setColors("");
      setNotes("");
      setReferences("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setDefault(id: string) {
    await fetch(`/api/brands/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    await refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/brands/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 surface p-5">
        <h2 className="font-semibold text-zinc-100">{t.newBrand}</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          className="field"
        />
        <input
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          placeholder={t.voicePlaceholder}
          className="field"
        />
        <input
          value={colors}
          onChange={(e) => setColors(e.target.value)}
          placeholder={t.colorsPlaceholder}
          className="field"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
          rows={2}
          className="field"
        />
        <label className="block">
          <span className="field-label">{t.referencesLabel}</span>
          <textarea
            value={references}
            onChange={(e) => setReferences(e.target.value)}
            placeholder={"https://…/lice.png\nhttps://…/proizvod.png"}
            rows={2}
            className="mt-1 field"
          />
          <span className="mt-1 block text-xs text-zinc-400">{t.referencesHint}</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          {t.setDefault}
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button onClick={create} disabled={busy || name.trim().length === 0}>
          {busy ? t.saving : t.saveBrand}
        </Button>
      </div>

      <div className="space-y-3">
        {brands.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-zinc-400">
            {t.emptyPrefix}{" "}
            <Link href="/studio/brand-kit" className="font-medium text-violet-300 underline">
              Brand Kit
            </Link>{" "}
            {t.emptySuffix}
          </div>
        )}
        {brands.map((b) => (
          <div
            key={b.id}
            className="flex items-start justify-between surface p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-100">{b.name}</span>
                {b.isDefault && (
                  <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-300">
                    {t.defaultBadge}
                  </span>
                )}
              </div>
              {b.voice && (
                <p className="text-sm text-zinc-400">
                  {t.voiceLabel} {b.voice}
                </p>
              )}
              {b.colors.length > 0 && (
                <p className="text-sm text-zinc-400">
                  {t.colorsLabel} {b.colors.join(", ")}
                </p>
              )}
              {b.referenceImages.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{t.referenceListLabel}</span>
                  {b.referenceImages.slice(0, 4).map((u) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={u}
                      src={u}
                      alt={t.referenceAlt}
                      className="h-10 w-10 rounded-md border border-white/10 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!b.isDefault && (
                <Button variant="ghost" onClick={() => setDefault(b.id)}>
                  {t.makeDefault}
                </Button>
              )}
              <Button variant="ghost" onClick={() => remove(b.id)}>
                {t.delete}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
