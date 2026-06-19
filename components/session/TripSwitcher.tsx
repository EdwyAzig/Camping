"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Tent } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSessionManager } from "@/components/session/SessionManagerProvider";
import { useTranslations } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function TripSwitcher() {
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const { memberships, membershipsLoading, trip, actionLoading, switchTrip } = useSessionManager();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, trip?.id]);

  if (membershipsLoading || memberships.length <= 1) return null;

  async function handleSelect(tripId: string) {
    if (tripId === trip?.id) {
      setOpen(false);
      return;
    }

    setOpen(false);
    const ok = await switchTrip(tripId);
    if (ok && pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  }

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 text-[11px] text-ember/80 hover:text-ember transition-colors"
        title={t("session.switchGroup")}
      >
        <Tent className="w-3 h-3" />
        <span>{t("session.groupsCount", { count: memberships.length })}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[220px] rounded-xl border border-glass-border bg-night/95 backdrop-blur-xl shadow-xl py-1">
          {memberships.map((membership) => (
            <button
              key={membership.id}
              type="button"
              disabled={actionLoading}
              onClick={() => handleSelect(membership.id)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm transition-colors",
                membership.id === trip?.id
                  ? "bg-ember/10 text-ember"
                  : "text-cream/80 hover:bg-white/5"
              )}
            >
              <span className="block truncate font-medium">{membership.name}</span>
              <span className="block truncate text-xs text-cream/45">{membership.location_name}</span>
            </button>
          ))}
          <div className="border-t border-glass-border mt-1 pt-1 px-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/sessione");
              }}
              className="w-full text-left px-2 py-1.5 text-xs text-cream/50 hover:text-cream hover:bg-white/5 rounded-lg"
            >
              {t("session.manageGroups")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
