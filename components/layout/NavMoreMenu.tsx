"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MoreHorizontal,
  Navigation,
  Wrench,
  Wallet,
  Users,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/client";

export const morePaths = ["/luogo", "/attrezzatura", "/cassa", "/sessione", "/impostazioni"];

export function isMoreNavActive(pathname: string) {
  return morePaths.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

interface NavMoreMenuProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  variant: "mobile" | "desktop";
}

export function NavMoreMenu({ open, onOpen, onClose, variant }: NavMoreMenuProps) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const active = isMoreNavActive(pathname);

  const moreNav = [
    { href: "/luogo", label: t("nav.location"), icon: Navigation, desc: t("nav.locationDesc") },
    { href: "/attrezzatura", label: t("nav.equipment"), icon: Wrench, desc: t("nav.equipmentDesc") },
    { href: "/cassa", label: t("nav.cassa"), icon: Wallet, desc: t("nav.cassaDesc") },
    { href: "/sessione", label: t("nav.session"), icon: Users, desc: t("nav.sessionDesc") },
    { href: "/impostazioni", label: t("nav.settings"), icon: Settings, desc: t("nav.settingsDesc") },
  ];

  if (variant === "mobile") {
    return (
      <>
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl flex-1 min-w-0 max-w-[4.5rem] transition-all",
            active || open ? "text-ember" : "text-cream/45"
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-lg transition-all",
              (active || open) && "bg-ember/15 shadow-[0_0_12px_rgba(232,168,56,0.15)]"
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-medium truncate w-full text-center">{t("nav.more")}</span>
        </button>

        {open && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-night/70 backdrop-blur-sm"
              onClick={onClose}
              aria-label={t("nav.closeMenu")}
            />
            <div className="absolute bottom-0 inset-x-0 rounded-t-2xl border-t border-glass-border bg-night/95 backdrop-blur-xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-cream/70">{t("nav.moreSections")}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-cream/40 hover:text-cream hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {moreNav.map(({ href, label, icon: Icon, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex flex-col gap-1 p-3 rounded-xl border transition-colors",
                      pathname === href
                        ? "bg-ember/15 border-ember/30 text-ember"
                        : "border-glass-border text-cream/80 hover:border-ember/25 hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{label}</span>
                    <span className="text-[10px] text-cream/40">{desc}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        className={cn(
          "nav-pill flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200",
          active || open
            ? "bg-ember/15 text-ember border border-ember/25 shadow-[0_0_16px_rgba(232,168,56,0.1)] nav-pill-active"
            : "text-cream/55 hover:text-cream hover:bg-white/5"
        )}
      >
        <MoreHorizontal className="w-4 h-4" />
        {t("nav.more")}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={onClose}
            aria-label={t("nav.closeMenu")}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-glass-border bg-night/95 backdrop-blur-xl shadow-xl p-2 animate-fade-up">
            {moreNav.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  pathname === href
                    ? "bg-ember/15 text-ember"
                    : "text-cream/75 hover:bg-white/5 hover:text-cream"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-[10px] text-cream/40 truncate">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
