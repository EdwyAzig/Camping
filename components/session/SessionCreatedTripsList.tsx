"use client";

import { useMemo } from "react";
import { History, LogIn, Trash2, Users } from "lucide-react";
import type { CreatedTripSummary } from "@/lib/session-manager";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { useLocale, useTranslations } from "@/lib/i18n/client";
import { localeToIntl } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function statusLabel(
  trip: CreatedTripSummary,
  t: ReturnType<typeof useTranslations>["t"]
) {
  if (trip.is_active) {
    return { text: t("session.statusActive"), className: "bg-ember/20 text-ember border-ember/30" };
  }
  if (trip.member_count === 0) {
    return { text: t("session.statusEmpty"), className: "bg-cream/10 text-cream/50 border-cream/20" };
  }
  return { text: t("session.statusInactive"), className: "bg-forest-light/40 text-cream/60 border-glass-border" };
}

export function SessionCreatedTripsList({
  trips,
  loading,
  actionLoading,
  onJoin,
  onDelete,
}: {
  trips: CreatedTripSummary[];
  loading: boolean;
  actionLoading: boolean;
  onJoin: (inviteCode: string) => void;
  onDelete: (trip: CreatedTripSummary) => void;
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

  function formatCreatedAt(iso: string): string {
    return dateFormatter.format(new Date(iso));
  }

  const pastTrips = trips.filter((trip) => !trip.is_active);

  if (loading) {
    return (
      <Card glow gradient>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-ember" />
          {t("session.yourSessions")}
        </CardTitle>
        <CardDescription>{t("session.loadingSessions")}</CardDescription>
      </Card>
    );
  }

  if (trips.length === 0) {
    return (
      <Card glow gradient>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-ember" />
          {t("session.yourSessions")}
        </CardTitle>
        <CardDescription>{t("session.noSessions")}</CardDescription>
      </Card>
    );
  }

  return (
    <Card glow gradient>
      <CardTitle className="flex items-center gap-2">
        <History className="w-5 h-5 text-ember" />
        {t("session.yourSessions")}
      </CardTitle>
      <CardDescription className="mb-4">
        {pastTrips.length > 0
          ? pastTrips.length === 1
            ? t("session.pastSessionsDescription", { count: pastTrips.length })
            : t("session.pastSessionsDescriptionPlural", { count: pastTrips.length })
          : t("session.allSessionsDescription")}
      </CardDescription>

      <ul className="space-y-2">
        {trips.map((trip) => {
          const status = statusLabel(trip, t);
          return (
            <li
              key={trip.id}
              className={cn(
                "rounded-xl border p-3",
                trip.is_active
                  ? "border-ember/30 bg-ember/5"
                  : "border-glass-border bg-night/30"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-medium text-cream truncate">{trip.name}</p>
                  <p className="text-xs text-cream/45 truncate">{trip.location_name}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border",
                    status.className
                  )}
                >
                  {status.text}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream/40 mb-3">
                <span>{formatCreatedAt(trip.created_at)}</span>
                <span className="font-mono tracking-wider text-ember/70">{trip.invite_code}</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {trip.member_count === 1
                    ? t("common.memberCount", { count: trip.member_count })
                    : t("common.membersCount", { count: trip.member_count })}
                </span>
              </div>

              <div className="flex gap-2">
                {!trip.is_active && (
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    disabled={actionLoading}
                    onClick={() => onJoin(trip.invite_code)}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {t("session.rejoin")}
                  </Button>
                )}
                {trip.can_delete && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    className={trip.is_active ? "flex-1" : ""}
                    disabled={actionLoading}
                    onClick={() => onDelete(trip)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("common.delete")}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
