"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Gem, LogOut } from "lucide-react";
import { useCredits } from "@/components/credits-context";
import { useLocale } from "@/components/locale-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { NavIcon } from "@/components/icons";
import { OrgSwitcher } from "@/components/org-switcher";

type OrgItem = { id: string; slug: string; name: string; personal: boolean };

const NAV = [
  { id: "studio", href: "/studio", exact: true },
  { id: "brand", href: "/studio/brand" },
  { id: "content", href: "/studio/content" },
  { id: "web", href: "/studio/website" },
  { id: "app", href: "/studio/app-builder" },
  { id: "logo", href: "/studio/logo" },
  { id: "history", href: "/studio/history" },
  { id: "calendar", href: "/studio/calendar" },
] as const;

const T = {
  sr: {
    studio: "Početna",
    brand: "Brend",
    content: "Content",
    web: "Web",
    app: "App",
    logo: "Logo",
    history: "Istorija",
    calendar: "Kalendar",
    credits: "kredita",
    signOut: "Odjavi se",
    signOutShort: "Odjavi",
  },
  en: {
    studio: "Home",
    brand: "Brand",
    content: "Content",
    web: "Web",
    app: "App",
    logo: "Logo",
    history: "History",
    calendar: "Calendar",
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

function CreditPill({ creditsLabel }: { creditsLabel: string }) {
  const { balance, loading } = useCredits();
  return (
    <span
      title={creditsLabel}
      className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-zinc-200"
    >
      <Gem className="h-4 w-4 text-violet-400" strokeWidth={2} aria-hidden />
      {loading && balance == null ? "…" : (balance ?? 0)}
      <span className="text-zinc-500">{creditsLabel}</span>
    </span>
  );
}

export function StudioSidebar({
  userLabel,
  activeOrg,
  orgs,
}: {
  userLabel: string;
  activeOrg: { slug: string; name: string };
  orgs: OrgItem[];
}) {
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
            <NavIcon id={item.id} className="h-[18px] w-[18px] shrink-0" />
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
        <div className="mb-4 px-1">
          <Logo size={24} />
        </div>
        <div className="mb-5">
          <OrgSwitcher activeOrg={activeOrg} orgs={orgs} />
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
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              {t.signOut}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar + scrollable nav */}
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-[#0a0a0f]/80 px-3 py-2.5 backdrop-blur-xl md:hidden">
        <div className="min-w-0 flex-1">
          <OrgSwitcher activeOrg={activeOrg} orgs={orgs} />
        </div>
        <CreditPill creditsLabel={t.credits} />
        <button onClick={logout} className="shrink-0 text-xs text-zinc-400 hover:text-white">
          {t.signOutShort}
        </button>
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
