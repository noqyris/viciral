"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCredits } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";
import { LanguageSwitcher } from "@/components/language-switcher";

const NAV = [
  { id: "studio", href: "/studio", icon: "⚡", exact: true },
  { id: "templates", href: "/studio/templates", icon: "🍱" },
  { id: "calendar", href: "/studio/calendar", icon: "📅" },
  { id: "history", href: "/studio/history", icon: "🗂️" },
  { id: "brands", href: "/studio/brand", icon: "🎨" },
  { id: "connections", href: "/studio/connections", icon: "🔗" },
] as const;

const T = {
  sr: {
    studio: "Studio",
    templates: "Recepti",
    calendar: "Kalendar",
    history: "Istorija",
    brands: "Brendovi",
    connections: "Povezivanje",
    credits: "kredita",
    signOut: "Odjavi se",
    signOutShort: "Odjavi",
  },
  en: {
    studio: "Studio",
    templates: "Templates",
    calendar: "Calendar",
    history: "History",
    brands: "Brands",
    connections: "Connections",
    credits: "credits",
    signOut: "Sign out",
    signOutShort: "Sign out",
  },
} as const;

function isActive(pathname: string, item: { href: string; exact?: boolean }) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");
}

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm";
  return (
    <Link href="/" className="flex items-center gap-2">
      <span
        className={`grid ${box} place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 font-bold text-white shadow-[0_4px_20px_-4px_rgba(139,92,246,0.7)]`}
      >
        V
      </span>
      <span className="text-lg font-semibold tracking-tight">Viciral</span>
    </Link>
  );
}

function CreditPill({ creditsLabel }: { creditsLabel: string }) {
  const { balance, loading } = useCredits();
  return (
    <span
      title={creditsLabel}
      className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-zinc-200"
    >
      <span aria-hidden className="text-violet-400">
        ◈
      </span>
      {loading && balance == null ? "…" : (balance ?? 0)}
      <span className="text-zinc-500">{creditsLabel}</span>
    </span>
  );
}

export function StudioSidebar({ userLabel }: { userLabel: string }) {
  const pathname = usePathname();
  const t = T[useLocale()];
  const logout = () => signOut({ callbackUrl: "/login" });

  const links = (
    <>
      {NAV.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-violet-500/15 font-medium text-white ring-1 ring-inset ring-violet-400/20"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {t[item.id]}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-white/[0.02] px-4 py-5 backdrop-blur-xl md:flex">
        <div className="mb-8 px-2">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1">{links}</nav>
        <div className="mt-4 space-y-3 border-t border-white/10 px-1 pt-4">
          <div className="flex items-center justify-between gap-2">
            <CreditPill creditsLabel={t.credits} />
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-zinc-500" title={userLabel}>
              {userLabel}
            </span>
            <button
              onClick={logout}
              className="text-xs text-zinc-400 transition-colors hover:text-white"
            >
              {t.signOut}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar + scrollable nav */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/10 bg-[#0a0a0f]/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <CreditPill creditsLabel={t.credits} />
          <button onClick={logout} className="text-xs text-zinc-400 hover:text-white">
            {t.signOutShort}
          </button>
        </div>
      </div>
      <nav className="sticky top-[57px] z-20 flex gap-1 overflow-x-auto border-b border-white/10 bg-[#0a0a0f]/80 px-3 py-2 backdrop-blur-xl md:hidden">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                active ? "bg-violet-500/15 font-medium text-white" : "text-zinc-400"
              }`}
            >
              {t[item.id]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
