import { getCurrentUser } from "@/lib/auth";
import { listBrands } from "@/lib/brand/profile";
import { BrandManager, type BrandView } from "@/components/brand-manager";
import { colorsToStrings } from "@/lib/brand/inject";
import { referenceImagesToStrings } from "@/lib/brand/normalize";

export const dynamic = "force-dynamic";

export default async function BrandPage() {
  const user = await getCurrentUser();
  const brands = await listBrands(user.id);

  const view: BrandView[] = brands.map((b) => ({
    id: b.id,
    name: b.name,
    voice: b.voice,
    notes: b.notes,
    colors: colorsToStrings(b.colors),
    referenceImages: referenceImagesToStrings(b.referenceImages),
    isDefault: b.isDefault,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-zinc-100">Brendovi</h1>
      <p className="mb-8 text-zinc-400">
        Brend memorija (ton, boje, napomene) se ubacuje u svaku generaciju.
      </p>
      <BrandManager initial={view} />
    </main>
  );
}
