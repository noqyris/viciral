"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { setActiveOrg, createBrand } from "@/app/studio/org-actions";
import { useLocale } from "@/components/locale-context";

type Org = { id: string; slug: string; name: string; personal: boolean };

const T = {
  sr: { newBrand: "Novi brend", create: "Napravi", namePh: "Ime brenda", label: "Brend" },
  en: { newBrand: "New brand", create: "Create", namePh: "Brand name", label: "Brand" },
} as const;

function Mark({ name }: { name: string }) {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-bold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Active brand/org + a dropdown to switch or create a new brand. */
export function OrgSwitcher({
  activeOrg,
  orgs,
}: {
  activeOrg: { slug: string; name: string };
  orgs: Org[];
}) {
  const t = T[useLocale()];
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]"
      >
        <Mark name={activeOrg.name} />
        <span className="min-w-0 flex-1">
          <span className="mono block text-[10px] uppercase tracking-wider text-zinc-500">{t.label}</span>
          <span className="block truncate text-sm font-medium text-zinc-100">{activeOrg.name}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-zinc-500" aria-hidden />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-white/12 bg-[#101015] p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
            <div className="max-h-60 overflow-y-auto">
              {orgs.map((o) => (
                <form key={o.id} action={setActiveOrg.bind(null, o.slug)}>
                  <button
                    type="submit"
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                      o.slug === activeOrg.slug ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    <Mark name={o.name} />
                    <span className="min-w-0 flex-1 truncate">{o.name}</span>
                    {o.slug === activeOrg.slug && <Check className="size-4 shrink-0 text-violet-300" aria-hidden />}
                  </button>
                </form>
              ))}
            </div>

            <div className="mt-1.5 border-t border-white/8 pt-1.5">
              {adding ? (
                <form action={createBrand} className="flex items-center gap-1.5 px-1 py-0.5">
                  <input
                    name="name"
                    required
                    minLength={2}
                    autoFocus
                    placeholder={t.namePh}
                    className="field !py-1.5 text-sm"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white"
                  >
                    {t.create}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Plus className="size-4 text-violet-300" aria-hidden />
                  {t.newBrand}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
