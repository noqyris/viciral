import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/studio");

  return (
    <AuthShell>
      <AuthForm mode="login" googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
