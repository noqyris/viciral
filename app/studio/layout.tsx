import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreditsProvider } from "@/components/credits-context";
import { StudioSidebar } from "@/components/studio-sidebar";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userLabel = session.user.name || session.user.email || "Nalog";

  return (
    <CreditsProvider>
      <StudioSidebar userLabel={userLabel} />
      <div className="flex min-h-screen flex-col md:pl-60">{children}</div>
    </CreditsProvider>
  );
}
