import { getCurrentUser } from "@/lib/auth";
import { listScheduled } from "@/lib/publishing/schedule";
import { isPlatform } from "@/lib/publishing/types";
import { CalendarManager, type ScheduledView } from "@/components/calendar-manager";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ caption?: string; mediaUrl?: string; platform?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const posts = await listScheduled(user.id);

  const view: ScheduledView[] = posts.map((p) => ({
    id: p.id,
    platform: p.platform,
    caption: p.caption,
    scheduledAt: p.scheduledAt.toISOString(),
    status: p.status,
    mediaUrl: p.mediaUrl,
    error: p.error,
  }));

  // Prefill the schedule form when arriving from a module's "Zakaži" action.
  const seed = {
    caption: sp.caption,
    mediaUrl: sp.mediaUrl,
    platform: sp.platform && isPlatform(sp.platform) ? sp.platform : undefined,
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-100">Kalendar</h1>
      <p className="mb-8 text-zinc-400">Zakaži objave i prati ih do izlaska.</p>
      <CalendarManager initial={view} seed={seed} />
    </main>
  );
}
