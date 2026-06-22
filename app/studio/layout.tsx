import Link from "next/link";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-3">
          <Link href="/" className="font-semibold text-zinc-900">
            Viciral
          </Link>
          <div className="flex items-center gap-4 text-sm text-zinc-600">
            <Link href="/studio" className="hover:text-zinc-900">
              Studio
            </Link>
            <Link href="/studio/history" className="hover:text-zinc-900">
              Istorija
            </Link>
            <Link href="/studio/brand" className="hover:text-zinc-900">
              Brendovi
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
