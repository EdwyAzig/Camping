"use client";

import { useMemo } from "react";
import { Check, Tent, Users } from "lucide-react";
import type { MembershipSummary } from "@/lib/session-manager";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { useLocale, useTranslations } from "@/lib/i18n/client";
import { localeToIntl } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function SessionMyTripsList({
  trips,
  activeTripId,
  loading,
  actionLoading,
  onSwitch,
}: {
  trips: MembershipSummary[];
  activeTripId: string | null;
  loading: boolean;
  actionLoading: boolean;
  onSwitch: (tripId: string) => void;
}) {
  const { t } = useTranslations();
  const locale = useLocale();
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeToIntl(locale), {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  if (loading) {
    return (
      <Card glow gradient>
        <CardTitle className="flex items-center gap-2">
          <Tent className="w-5 h-5 text-ember" />
          {t("session.myGroups")}
        </CardTitle>
        <CardDescription>{t("session.loadingGroups")}</CardDescription>
      </Card>
    );
  }

  if (trips.length === 0) {
    return null;
  }

  return (
    <Card glow gradient>
      <CardTitle className="flex items-center gap-2">
        <Tent className="w-5 h-5 text-ember" />
        {t("session.myGroups")}
      </CardTitle>
      <CardDescription className="mb-4">
        {trips.length === 1
          ? t("session.myGroupsDescriptionOne")
          : t("session.myGroupsDescription", { count: trips.length })}
      </CardDescription>

      <ul className="space-y-2">
        {trips.map((trip) => {
          const isActive = trip.id === activeTripId;
          return (
            <li
              key={trip.id}
              className={cn(
                "rounded-xl border p-3",
                isActive ? "border-ember/30 bg-ember/5" : "border-glass-border bg-night/30"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-medium text-cream truncate">{trip.name}</p>
                  <p className="text-xs text-cream/45 truncate">{trip.location_name}</p>
                </div>
                {isActive && (
                  <span className="shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border bg-ember/20 text-ember border-ember/30">
                    {t("session.statusActive")}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream/40 mb-3">
                <span>{dateFormatter.format(new Date(trip.joined_at))}</span>
                <span className="font-mono tracking-wider text-ember/70">{trip.invite_code}</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {trip.member_count === 1
                    ? t("common.memberCount", { count: trip.member_count })
                    : t("common.membersCount", { count: trip.member_count })}
                </span>
                <span>
                  {trip.role === "owner" ? t("session.roleOrganizer") : t("session.roleMember")}
                </span>
              </div>

              {!isActive && (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={actionLoading}
                  onClick={() => onSwitch(trip.id)}
                >
                  {t("session.switchToGroup")}
                </Button>
              )}

              {isActive && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-ember/80 py-1">
                  <Check className="w-3.5 h-3.5" />
                  {t("session.currentGroup")}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
