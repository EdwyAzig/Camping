"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tent,
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  CalendarDays,
  LogOut,
  Copy,
  Check,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NavMoreMenu } from "@/components/layout/NavMoreMenu";
import type { Trip, TripMember } from "@/lib/types";

const mainNav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/programma", label: "Programma", icon: CalendarDays },
  { href: "/spesa", label: "Spesa", icon: ShoppingCart },
  { href: "/pasti", label: "Pasti", icon: UtensilsCrossed },
];

const memberColors = [
  "from-ember/30 to-ember/10 border-ember/40",
  "from-moss/40 to-forest-light/20 border-moss/40",
  "from-forest-light/40 to-forest/20 border-forest-light/40",
  "from-cream/20 to-cream/5 border-cream/20",
];

export function AppShell({
  trip,
  members,
  children,
}: {
  trip: Trip;
  members: TripMember[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function copyInvite() {
    const url = `${window.location.origin}/join/${trip.invite_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col pb-nav-safe">
      <header className="sticky top-0 z-50 border-b border-glass-border bg-night/70 backdrop-blur-xl pt-safe">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ember/30 to-transparent" />
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="icon-glow shrink-0 campfire-icon !w-9 !h-9 sm:!w-12 sm:!h-12">
              <Tent className="w-4 h-4 sm:w-5 sm:h-5 text-ember" />
            </div>
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-fraunces)] text-base sm:text-lg truncate leading-tight">
                {trip.name}
              </h1>
              <p className="text-[11px] sm:text-xs text-cream/45 truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-ember/70 shrink-0" />
                {trip.location_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={copyInvite}
              className="flex items-center gap-1.5 text-xs bg-forest-light/40 p-2 sm:px-3 sm:py-1.5 rounded-lg border border-glass-border hover:border-ember/40 hover:bg-forest-light/60 transition-all"
              title="Copia link invito"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-ember" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="font-mono tracking-wider hidden sm:inline">{trip.invite_code}</span>
            </button>
            <div className="hidden sm:flex -space-x-2">
              {members.slice(0, 3).map((m, i) => (
                <div
                  key={m.user_id}
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-night flex items-center justify-center text-[10px] sm:text-xs font-semibold text-cream bg-gradient-to-br",
                    memberColors[i % memberColors.length]
                  )}
                  title={m.display_name}
                >
                  {m.display_name.charAt(0).toUpperCase()}
                </div>
              ))}
              {members.length > 3 && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-night/80 border-2 border-night flex items-center justify-center text-[9px] sm:text-[10px] text-cream/60">
                  +{members.length - 3}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-cream/40 hover:text-cream rounded-lg hover:bg-white/5 transition-colors"
              title="Esci"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <nav className="hidden md:flex max-w-5xl mx-auto px-2 pb-2 gap-1">
          {mainNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "nav-pill flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200",
                  active
                    ? "bg-ember/15 text-ember border border-ember/25 shadow-[0_0_16px_rgba(232,168,56,0.1)] nav-pill-active"
                    : "text-cream/55 hover:text-cream hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
          <NavMoreMenu
            variant="desktop"
            open={moreOpen}
            onOpen={() => setMoreOpen(true)}
            onClose={() => setMoreOpen(false)}
          />
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 min-w-0">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-glass-border bg-night/85 backdrop-blur-xl px-safe">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/20 to-transparent" />
        <div className="flex justify-between max-w-lg mx-auto px-0.5 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {mainNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl flex-1 min-w-0 max-w-[4.5rem] transition-all",
                  active ? "text-ember" : "text-cream/45 hover:text-cream/70"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    active && "bg-ember/15 shadow-[0_0_12px_rgba(232,168,56,0.15)]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium truncate w-full text-center">{label}</span>
              </Link>
            );
          })}
          <NavMoreMenu
            variant="mobile"
            open={moreOpen}
            onOpen={() => setMoreOpen(true)}
            onClose={() => setMoreOpen(false)}
          />
        </div>
      </nav>
    </div>
  );
}
