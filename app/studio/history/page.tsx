import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: "Završeno", cls: "bg-green-100 text-green-700" },
  RUNNING: { label: "U toku", cls: "bg-amber-100 text-amber-700" },
  PENDING: { label: "Na čekanju", cls: "bg-zinc-100 text-zinc-600" },
  FAILED: { label: "Greška", cls: "bg-red-100 text-red-700" },
};

export default async function HistoryPage() {
  const user = await getCurrentUser();
  const generations = await prisma.generation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { assets: { where: { kind: "image" }, take: 4 } },
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-900">Istorija</h1>
      <p className="mb-8 text-zinc-600">Tvoje poslednje generacije.</p>

      {generations.length === 0 ? (
        <p className="text-sm text-zinc-500">Još nema generacija.</p>
      ) : (
        <div className="space-y-4">
          {generations.map((g) => {
            const status = STATUS[g.status] ?? STATUS.PENDING;
            return (
              <div key={g.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-zinc-900">{g.module}</div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {g.mode === "auto" ? "Auto režim" : "Ručno"} · {g.creditsUsed} kredita ·{" "}
                  {g.createdAt.toLocaleString("sr-RS")}
                </div>
                {g.error && <div className="mt-2 text-sm text-red-600">{g.error}</div>}
                {g.assets.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {g.assets.map((a) =>
                      a.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={a.id}
                          src={a.url}
                          alt="Asset"
                          className="h-16 w-16 rounded-lg border border-zinc-200 object-cover"
                        />
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
