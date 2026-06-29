import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreditsProvider } from "@/components/credits-context";
import { StudioSidebar } from "@/components/studio-sidebar";
import { getActiveOrg } from "@/lib/active-org";
import { getUserOrgs } from "@/lib/org";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

  const userLabel = session.user.name || session.user.email || "Nalog";
  const [activeOrg, orgs] = await Promise.all([getActiveOrg(userId), getUserOrgs(userId)]);

  return (
    <CreditsProvider>
      <StudioSidebar
        userLabel={userLabel}
        activeOrg={{ slug: activeOrg.slug, name: activeOrg.name }}
        orgs={orgs.map((o) => ({ id: o.id, slug: o.slug, name: o.name, personal: o.personal }))}
      />
      <div className="flex min-h-screen flex-col md:pl-60">{children}</div>
    </CreditsProvider>
  );
}
