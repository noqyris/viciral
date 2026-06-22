"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { colorsToStrings } from "@/lib/brand/inject";

export interface BrandView {
  id: string;
  name: string;
  voice: string | null;
  notes: string | null;
  colors: string[];
  isDefault: boolean;
}

interface RawBrand {
  id: string;
  name: string;
  voice: string | null;
  notes: string | null;
  colors: unknown;
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
    isDefault: b.isDefault,
  };
}

export function BrandManager({ initial }: { initial: BrandView[] }) {
  const [brands, setBrands] = useState<BrandView[]>(initial);
  const [name, setName] = useState("");
  const [voice, setVoice] = useState("");
  const [colors, setColors] = useState("");
  const [notes, setNotes] = useState("");
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
          isDefault,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Greška");
      setName("");
      setVoice("");
      setColors("");
      setNotes("");
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
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">Novi brend</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naziv brenda"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
        <input
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          placeholder="Ton glasa (npr. duhovit, direktan)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
        <input
          value={colors}
          onChange={(e) => setColors(e.target.value)}
          placeholder="Boje, zarezom (#111, #f5f5f5)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Napomene (npr. izbegavaj emotikone)"
          rows={2}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          Postavi kao podrazumevani
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={create} disabled={busy || name.trim().length === 0}>
          {busy ? "Čuvam…" : "Sačuvaj brend"}
        </Button>
      </div>

      <div className="space-y-3">
        {brands.length === 0 && (
          <p className="text-sm text-zinc-500">Još nemaš nijedan brend.</p>
        )}
        {brands.map((b) => (
          <div
            key={b.id}
            className="flex items-start justify-between rounded-xl border border-zinc-200 bg-white p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-900">{b.name}</span>
                {b.isDefault && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    Podrazumevani
                  </span>
                )}
              </div>
              {b.voice && <p className="text-sm text-zinc-500">Ton: {b.voice}</p>}
              {b.colors.length > 0 && (
                <p className="text-sm text-zinc-500">Boje: {b.colors.join(", ")}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!b.isDefault && (
                <Button variant="ghost" onClick={() => setDefault(b.id)}>
                  Podrazumevani
                </Button>
              )}
              <Button variant="ghost" onClick={() => remove(b.id)}>
                Obriši
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
