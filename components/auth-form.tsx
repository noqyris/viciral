"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-context";

const T = {
  sr: {
    signupTitle: "Napravi nalog",
    loginTitle: "Dobrodošao nazad",
    signupSub: "200 besplatnih kredita za početak.",
    loginSub: "Prijavi se da nastaviš.",
    google: "Nastavi sa Google",
    or: "ili",
    name: "Ime (opciono)",
    namePh: "Tvoje ime",
    email: "Email",
    password: "Lozinka",
    passwordPhSignup: "bar 8 znakova",
    signupErr: "Greška pri registraciji",
    badCreds: "Pogrešan email ili lozinka.",
    wait: "Trenutak…",
    signupBtn: "Registruj se",
    loginBtn: "Prijavi se",
    haveAccount: "Već imaš nalog?",
    noAccount: "Nemaš nalog?",
    goLogin: "Prijavi se",
    goSignup: "Registruj se",
  },
  en: {
    signupTitle: "Create account",
    loginTitle: "Welcome back",
    signupSub: "200 free credits to get started.",
    loginSub: "Sign in to continue.",
    google: "Continue with Google",
    or: "or",
    name: "Name (optional)",
    namePh: "Your name",
    email: "Email",
    password: "Password",
    passwordPhSignup: "at least 8 characters",
    signupErr: "Sign-up failed",
    badCreds: "Wrong email or password.",
    wait: "One moment…",
    signupBtn: "Sign up",
    loginBtn: "Sign in",
    haveAccount: "Already have an account?",
    noAccount: "No account yet?",
    goLogin: "Sign in",
    goSignup: "Sign up",
  },
} as const;

export function AuthForm({
  mode,
  googleEnabled,
}: {
  mode: "login" | "signup";
  googleEnabled: boolean;
}) {
  const t = T[useLocale()];
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignup) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password, name: name || undefined }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? t.signupErr);
      }
      const r = await signIn("credentials", { email, password, redirect: false });
      if (r?.error) throw new Error(t.badCreds);
      window.location.href = "/studio";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-base font-bold text-white shadow-[0_8px_30px_-10px_rgba(139,92,246,0.8)]">
          V
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {isSignup ? t.signupTitle : t.loginTitle}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">{isSignup ? t.signupSub : t.loginSub}</p>
      </div>

      <div className="surface p-6">
        {googleEnabled && (
          <>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/studio" })}
            >
              <span className="mr-2">🟦</span> {t.google}
            </Button>
            <div className="my-4 flex items-center gap-3 text-xs text-zinc-500">
              <span className="h-px flex-1 bg-white/10" />
              {t.or}
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-3">
          {isSignup && (
            <label className="block">
              <span className="field-label">{t.name}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePh}
                className="mt-1 field"
              />
            </label>
          )}
          <label className="block">
            <span className="field-label">{t.email}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ti@primer.com"
              className="mt-1 field"
            />
          </label>
          <label className="block">
            <span className="field-label">{t.password}</span>
            <input
              type="password"
              required
              minLength={isSignup ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? t.passwordPhSignup : "••••••••"}
              className="mt-1 field"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t.wait : isSignup ? t.signupBtn : t.loginBtn}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-400">
        {isSignup ? (
          <>
            {t.haveAccount}{" "}
            <Link href="/login" className="font-medium text-violet-300 hover:underline">
              {t.goLogin}
            </Link>
          </>
        ) : (
          <>
            {t.noAccount}{" "}
            <Link href="/signup" className="font-medium text-violet-300 hover:underline">
              {t.goSignup}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
