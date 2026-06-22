import Link from "next/link";
import { MODULES } from "@/lib/modules/registry";

export default function StudioHub() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Studio</h1>
        <p className="mt-1 text-zinc-600">Izaberi šta želiš da napraviš.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => {
          const available = m.status === "available";
          const inner = (
            <div
              className={`flex h-full flex-col rounded-xl border p-5 transition-colors ${
                available
                  ? "border-zinc-200 bg-white hover:border-violet-300 hover:shadow-sm"
                  : "border-dashed border-zinc-200 bg-zinc-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{m.icon}</span>
                {!available && (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    Uskoro
                  </span>
                )}
              </div>
              <div className="mt-3 font-semibold text-zinc-900">{m.name}</div>
              <p className="mt-1 flex-1 text-sm text-zinc-500">{m.tagline}</p>
            </div>
          );

          return available ? (
            <Link key={m.slug} href={`/studio/${m.slug}`}>
              {inner}
            </Link>
          ) : (
            <div key={m.slug} aria-disabled>
              {inner}
            </div>
          );
        })}
      </div>
    </main>
  );
}
