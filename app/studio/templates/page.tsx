import Link from "next/link";
import { TEMPLATES } from "@/lib/templates/registry";
import { getModuleDef } from "@/lib/modules/registry";
import { getLocale } from "@/lib/i18n-server";
import { moduleName } from "@/lib/modules/i18n";

const T = {
  sr: {
    title: "Recepti",
    sub: "Gotovi šabloni koji pretpune modul — klikni i kreni, pa doteruj po želji.",
    use: "Koristi recept →",
  },
  en: {
    title: "Recipes",
    sub: "Ready-made templates that pre-fill a module — click and go, then tweak as you like.",
    use: "Use recipe →",
  },
} as const;

export default async function TemplatesPage() {
  const locale = await getLocale();
  const t = T[locale];

  // Group templates by module, in registry order.
  const bySlug = new Map<string, typeof TEMPLATES>();
  for (const t of TEMPLATES) {
    const list = bySlug.get(t.moduleSlug) ?? [];
    list.push(t);
    bySlug.set(t.moduleSlug, list);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{t.title}</h1>
        <p className="mt-1 text-zinc-400">{t.sub}</p>
      </header>

      <div className="space-y-10">
        {[...bySlug.entries()].map(([slug, templates]) => {
          const mod = getModuleDef(slug);
          if (!mod) return null;
          return (
            <section key={slug}>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">{mod.icon}</span>
                <h2 className="font-semibold text-zinc-100">
                  {moduleName(mod.slug, locale, mod.name)}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((tpl) => (
                  <Link
                    key={tpl.id}
                    href={`/studio/${slug}?template=${tpl.id}`}
                    className="flex h-full flex-col surface p-5 transition-colors hover:border-violet-300 hover:shadow-sm"
                  >
                    <div className="text-2xl">{tpl.icon}</div>
                    <div className="mt-2 font-semibold text-zinc-100">{tpl.title}</div>
                    <p className="mt-1 flex-1 text-sm text-zinc-400">{tpl.description}</p>
                    <span className="mt-3 text-sm font-medium text-violet-300">{t.use}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
