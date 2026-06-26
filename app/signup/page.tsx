import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/studio");

  return (
    <AuthShell>
      <AuthForm mode="signup" googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
