"use client";

import Link from "next/link";
import {
  MapPin,
  AlertTriangle,
  ArrowRight,
  Cloud,
  Users,
  Flame,
  Sparkles,
  Calendar,
  Wallet,
  Tent,
  Navigation,
  UtensilsCrossed,
} from "lucide-react";
import { TripMap } from "@/components/map/TripMap";
import { Card, CardTitle } from "@/components/ui/Card";
import { getTripMapsUrl } from "@/lib/default-location";
import { ProgressRing, StatCard } from "@/components/ui/Progress";
import { formatEuro, cn } from "@/lib/utils";
import { formatDateShort, formatDateLong, scheduleEntryLabel } from "@/lib/dates";
import { getPhaseLabel } from "@/lib/i18n/enums";
import { useLocale, useTranslations } from "@/lib/i18n/client";
import { calcLocationTotal } from "@/lib/finance";
import type {
  Trip,
  TripMember,
  WeatherInfo,
  FinanceSummary,
  ScheduleEntry,
} from "@/lib/types";

interface ControlCenterDashboardProps {
  trip: Trip;
  members: TripMember[];
  weather: WeatherInfo | null;
  finance: FinanceSummary;
  shoppingProgress: number;
  equipmentProgress: number;
  urgentItems: { label: string; type: string }[];
  nextTimeline: ScheduleEntry | null;
}

export function ControlCenterDashboard({
  trip,
  members,
  weather,
  finance,
  shoppingProgress,
  equipmentProgress,
  urgentItems,
  nextTimeline,
}: ControlCenterDashboardProps) {
  const { t } = useTranslations();
  const locale = useLocale();
  const readiness = Math.round((shoppingProgress + equipmentProgress) / 2);
  const locationCost = calcLocationTotal(trip);
  const shoppingAmt = finance.shoppingTotal;
  const activityAmt = finance.activitiesTotal;
  const grandTotal = finance.grandTotal || 1;
  const shoppingPct = (shoppingAmt / grandTotal) * 100;
  const activityPct = (activityAmt / grandTotal) * 100;
  const locationPct = (locationCost / grandTotal) * 100;

  const quickNav = [
    { href: "/luogo", label: t("nav.location"), icon: Navigation, color: "text-sky-300" },
    { href: "/programma", label: t("nav.program"), icon: Calendar, color: "text-ember" },
    { href: "/attrezzatura", label: t("nav.equipment"), icon: Tent, color: "text-orange-300" },
    { href: "/spesa", label: t("nav.shopping"), icon: Flame, color: "text-amber-300" },
    { href: "/pasti", label: t("nav.meals"), icon: UtensilsCrossed, color: "text-rose-300" },
    { href: "/cassa", label: t("nav.cassa"), icon: Wallet, color: "text-violet-300" },
  ];

  return (
    <div className="space-y-6">
      <section className="animate-fade-up">
        <Card glow gradient className="relative overflow-hidden p-0">
          <div className="absolute inset-0 bg-gradient-to-br from-ember/8 via-transparent to-moss/10 pointer-events-none" />
          <div className="relative p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-ember" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-ember/70 font-medium">
                    {t("dashboard.badge")}
                  </span>
                </div>
                <h2 className="font-[family-name:var(--font-fraunces)] text-xl sm:text-2xl md:text-4xl text-cream leading-tight break-words">
                  {trip.name}
                </h2>
                <p className="text-cream/55 flex items-center gap-1.5 mt-2 text-sm">
                  <MapPin className="w-4 h-4 text-ember shrink-0" />
                  {trip.location_name}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <div className="flex -space-x-2">
                    {members.map((m, i) => (
                      <div
                        key={m.user_id}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-ember/25 to-forest-light/30 border-2 border-night flex items-center justify-center text-xs font-semibold text-cream"
                        style={{ zIndex: members.length - i }}
                        title={m.display_name}
                      >
                        {m.display_name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-cream/40">
                    {t("common.inTeam", { count: members.length })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:w-auto shrink-0">
                {weather && (
                  <Card className="w-full sm:w-auto px-3 py-3 sm:px-4 sm:py-3 !bg-night/40 border-ember/15">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl shrink-0">{weather.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-cream/35 mb-0.5">
                          {t("common.today")}
                        </p>
                        <p className="text-2xl sm:text-xl font-[family-name:var(--font-fraunces)] text-ember leading-none">
                          {weather.temp}°
                        </p>
                        <p className="text-xs sm:text-[10px] text-cream/45 capitalize leading-snug mt-1">
                          {weather.description}
                        </p>
                      </div>
                      <Cloud className="w-4 h-4 text-cream/20 shrink-0 hidden sm:block ml-auto" />
                    </div>
                    {weather.forecast.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-ember/10 flex items-center gap-2">
                        <div className="grid grid-cols-5 gap-0.5 flex-1 min-w-0 sm:flex sm:gap-2">
                          {weather.forecast.map((day) => (
                            <div
                              key={day.date}
                              title={t("common.weatherForecastTitle", {
                                label: day.label,
                                description: day.description,
                                tempMax: day.tempMax,
                                tempMin: day.tempMin,
                              })}
                              className="flex flex-col items-center px-0.5 py-1 rounded-lg sm:min-w-[3rem] sm:px-1 sm:hover:bg-white/3 sm:transition-colors"
                            >
                              <span className="text-[8px] sm:text-[9px] text-cream/40 whitespace-nowrap leading-none">
                                {day.label}
                              </span>
                              <span className="text-base sm:text-lg leading-none my-1">
                                {day.icon}
                              </span>
                              <span className="text-[11px] font-medium text-ember leading-none">
                                {day.tempMax}°
                              </span>
                              <span className="text-[9px] text-cream/30 leading-none mt-0.5">
                                {day.tempMin}°
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="sm:hidden shrink-0 pl-1 border-l border-ember/10">
                          <ProgressRing
                            value={readiness}
                            label={t("common.ready")}
                            size={58}
                            className="gap-1"
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                )}
                <div className="hidden sm:flex justify-end shrink-0">
                  <ProgressRing
                    value={readiness}
                    label={t("common.readyToGo")}
                    sublabel={t("common.readyToGoSublabel")}
                    size={72}
                  />
                </div>
                {(!weather || weather.forecast.length === 0) && (
                  <div className="flex justify-center sm:hidden shrink-0">
                    <ProgressRing
                      value={readiness}
                      label={t("common.readyToGo")}
                      sublabel={t("common.readyToGoSublabel")}
                      size={72}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 animate-fade-up animate-fade-up-delay-1">
        <StatCard
          label={t("dashboard.departure")}
          value={
            trip.start_date
              ? formatDateShort(trip.start_date, locale)
              : trip.departure_date || t("common.toDefine")
          }
          sub={
            trip.end_date
              ? t("common.returnPrefix", { date: formatDateShort(trip.end_date, locale) })
              : trip.return_note || undefined
          }
          icon={Tent}
        />
        <StatCard label={t("dashboard.totalBudget")} value={formatEuro(finance.grandTotal, locale)} accent icon={Wallet} />
        <StatCard
          label={t("dashboard.costPerPerson")}
          value={formatEuro(finance.perPerson, locale)}
          sub={t("common.peopleCount", { count: members.length })}
          icon={Users}
        />
        <StatCard
          label={t("dashboard.team")}
          value={`${members.length}`}
          sub={t("common.activeMembers")}
          icon={Users}
        />
      </div>

      <Card className="p-3 md:p-4 overflow-hidden animate-fade-up animate-fade-up-delay-2">
        <TripMap
          lat={trip.lat}
          lng={trip.lng}
          locationName={trip.location_name}
          mapsUrl={getTripMapsUrl(trip)}
        />
      </Card>

      <div className="grid md:grid-cols-3 gap-4 animate-fade-up animate-fade-up-delay-2">
        <Card gradient className="md:col-span-2">
          <CardTitle className="text-base mb-4">{t("dashboard.preparationStatus")}</CardTitle>
          <div className="grid grid-cols-2 gap-4 sm:flex sm:justify-around py-2">
            <ProgressRing
              value={shoppingProgress}
              label={t("dashboard.shoppingReady")}
              sublabel={t("common.percentComplete", { percent: shoppingProgress })}
              size={72}
            />
            <ProgressRing
              value={equipmentProgress}
              label={t("dashboard.equipment")}
              sublabel={t("common.percentConfirmed", { percent: equipmentProgress })}
              size={72}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-glass-border">
            <p className="text-xs text-cream/45 mb-2">{t("dashboard.budgetDistribution")}</p>
            <div className="budget-bar">
              {shoppingPct > 0 && (
                <div
                  className="budget-segment bg-ember/80"
                  style={{ flexGrow: shoppingPct }}
                />
              )}
              {activityPct > 0 && (
                <div
                  className="budget-segment bg-moss/80"
                  style={{ flexGrow: activityPct }}
                />
              )}
              {locationPct > 0 && (
                <div
                  className="budget-segment bg-sky-600/60"
                  style={{ flexGrow: locationPct }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-cream/45">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-ember/80" />
                {t("dashboard.budgetShopping", { amount: formatEuro(shoppingAmt, locale) })}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-moss/80" />
                {t("dashboard.budgetActivities", { amount: formatEuro(activityAmt, locale) })}
              </span>
              {locationCost > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-600/60" />
                  {t("dashboard.budgetLocation", { amount: formatEuro(locationCost, locale) })}
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card gradient>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-ember" />
            {t("dashboard.theGroup")}
          </CardTitle>
          <ul className="mt-3 space-y-1">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-white/3 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-ember/20 to-forest-light/30 flex items-center justify-center text-xs text-ember font-semibold ring-1 ring-ember/15">
                  {m.display_name.charAt(0)}
                </span>
                <span className="flex-1 truncate">{m.display_name}</span>
                {m.role === "owner" && (
                  <span className="text-[9px] uppercase tracking-wide text-ember/50">{t("common.organizerShort")}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {urgentItems.length > 0 && (
        <Card className="border-red-500/25 bg-red-950/15 animate-fade-up animate-fade-up-delay-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
          <CardTitle className="text-base flex items-center gap-2 text-red-200 relative">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            {t("dashboard.urgentItems")}
          </CardTitle>
          <ul className="mt-3 flex flex-wrap gap-2 relative">
            {urgentItems.map((item, i) => (
              <li
                key={i}
                className="px-3 py-1.5 rounded-full text-sm bg-red-900/35 border border-red-800/40 text-red-100"
              >
                {item.label}
              </li>
            ))}
          </ul>
          <div className="flex gap-4 mt-3 relative">
            <Link href="/attrezzatura" className="text-xs text-ember hover:underline flex items-center gap-1">
              {t("nav.equipment")} <ArrowRight className="w-3 h-3" />
            </Link>
            <Link href="/spesa" className="text-xs text-ember hover:underline flex items-center gap-1">
              {t("nav.shopping")} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      )}

      {nextTimeline && (
        <Card glow className="border-ember/20 animate-fade-up animate-fade-up-delay-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ember/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="icon-glow shrink-0 !w-10 !h-10">
              <Flame className="w-4 h-4 text-ember campfire-icon" />
            </div>
            <div>
              <p className="text-[10px] text-ember uppercase tracking-[0.15em] mb-1">
                {t("dashboard.nextOnSchedule")}
                {nextTimeline.phase && (
                  <span className="ml-2 normal-case tracking-normal text-cream/45">
                    · {getPhaseLabel(nextTimeline.phase, t)}
                  </span>
                )}
              </p>
              <p className="font-[family-name:var(--font-fraunces)] text-lg">
                {nextTimeline.time_note}
              </p>
              <p className="text-cream/70 text-sm mt-0.5">{nextTimeline.description}</p>
              <p className="text-cream/40 text-xs mt-1">
                {nextTimeline.event_date
                  ? scheduleEntryLabel(nextTimeline.event_date, nextTimeline.day_label, locale)
                  : nextTimeline.day_label}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 animate-fade-up animate-fade-up-delay-4">
        {quickNav.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <Card hover className="p-3 sm:p-4 h-full group">
              <Icon className={cn("w-5 h-5 mb-1.5 sm:mb-2", color)} />
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs sm:text-sm font-medium text-cream/80">{label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-ember opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
