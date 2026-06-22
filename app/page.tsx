import Link from "next/link";
import { MODULES } from "@/lib/modules/registry";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-20 text-center">
      <span className="mb-4 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
        AI studio za kreatore
      </span>
      <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
        Spoji više AI modela. Napravi ono što sam ne možeš.
      </h1>
      <p className="mt-6 max-w-2xl text-pretty text-lg text-zinc-600">
        Viciral orkestrira Claude, Nano Banana i Seedance na jednom mestu —
        sadržaj za društvene mreže, cinematic video, brand identitet i sajtove.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/studio"
          className="rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          Otvori studio →
        </Link>
      </div>

      <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m) => (
          <div
            key={m.slug}
            className="rounded-xl border border-zinc-200 bg-white p-5 text-left"
          >
            <div className="text-2xl">{m.icon}</div>
            <div className="mt-2 font-semibold text-zinc-900">{m.name}</div>
            <p className="mt-1 text-sm text-zinc-500">{m.tagline}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
