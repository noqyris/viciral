import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth-form";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/studio");

  return (
    <main className="relative flex min-h-screen w-full flex-1 items-center justify-center px-6 py-12">
      <div className="absolute right-6 top-6">
        <LanguageSwitcher />
      </div>
      <AuthForm mode="signup" googleEnabled={googleEnabled} />
    </main>
  );
}
