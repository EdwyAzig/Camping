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
import { formatItalianDateShort, scheduleEntryLabel } from "@/lib/dates";
import { PHASE_LABELS } from "@/lib/trip-phases";
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

const quickNav = [
  { href: "/luogo", label: "Luogo", icon: Navigation, color: "text-sky-300" },
  { href: "/programma", label: "Programma", icon: Calendar, color: "text-ember" },
  { href: "/attrezzatura", label: "Attrezzatura", icon: Tent, color: "text-orange-300" },
  { href: "/spesa", label: "Spesa", icon: Flame, color: "text-amber-300" },
  { href: "/pasti", label: "Pasti", icon: UtensilsCrossed, color: "text-rose-300" },
  { href: "/cassa", label: "Cassa", icon: Wallet, color: "text-violet-300" },
];

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
  const readiness = Math.round((shoppingProgress + equipmentProgress) / 2);
  const locationCost = calcLocationTotal(trip);
  const shoppingAmt = finance.shoppingTotal;
  const activityAmt = finance.activitiesTotal;
  const grandTotal = finance.grandTotal || 1;
  const shoppingPct = (shoppingAmt / grandTotal) * 100;
  const activityPct = (activityAmt / grandTotal) * 100;
  const locationPct = (locationCost / grandTotal) * 100;

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
                    Control Center
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
                    {members.length} in squadra
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto shrink-0">
                {weather && (
                  <Card className="px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3 !bg-night/40 border-ember/15 flex-1 sm:flex-none min-w-0">
                    <span className="text-2xl sm:text-3xl shrink-0">{weather.icon}</span>
                    <div className="min-w-0">
                      <p className="text-lg sm:text-xl font-[family-name:var(--font-fraunces)] text-ember">
                        {weather.temp}°
                      </p>
                      <p className="text-[10px] text-cream/45 capitalize leading-tight truncate">
                        {weather.description}
                      </p>
                    </div>
                    <Cloud className="w-4 h-4 text-cream/20 shrink-0 hidden sm:block" />
                  </Card>
                )}
                <ProgressRing
                  value={readiness}
                  label="Pronto al via"
                  sublabel="spesa + attrezzatura"
                  size={72}
                />
              </div>
            </div>
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 animate-fade-up animate-fade-up-delay-1">
        <StatCard
          label="Partenza"
          value={
            trip.start_date
              ? formatItalianDateShort(trip.start_date)
              : trip.departure_date || "Da definire"
          }
          sub={
            trip.end_date
              ? `Ritorno ${formatItalianDateShort(trip.end_date)}`
              : trip.return_note || undefined
          }
          icon={Tent}
        />
        <StatCard label="Budget totale" value={formatEuro(finance.grandTotal)} accent icon={Wallet} />
        <StatCard
          label="Costo a testa"
          value={formatEuro(finance.perPerson)}
          sub={`${members.length} persone`}
          icon={Users}
        />
        <StatCard label="Squadra" value={`${members.length}`} sub="membri attivi" icon={Users} />
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
          <CardTitle className="text-base mb-4">Stato preparativi</CardTitle>
          <div className="grid grid-cols-2 gap-4 sm:flex sm:justify-around py-2">
            <ProgressRing
              value={shoppingProgress}
              label="Spesa pronta"
              sublabel={`${shoppingProgress}% completato`}
              size={72}
            />
            <ProgressRing
              value={equipmentProgress}
              label="Attrezzatura"
              sublabel={`${equipmentProgress}% confermato`}
              size={72}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-glass-border">
            <p className="text-xs text-cream/45 mb-2">Distribuzione budget</p>
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
                Spesa {formatEuro(shoppingAmt)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-moss/80" />
                Attività {formatEuro(activityAmt)}
              </span>
              {locationCost > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-600/60" />
                  Luogo {formatEuro(locationCost)}
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card gradient>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-ember" />
            Il gruppo
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
                  <span className="text-[9px] uppercase tracking-wide text-ember/50">org</span>
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
            Cose urgenti
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
              Attrezzatura <ArrowRight className="w-3 h-3" />
            </Link>
            <Link href="/spesa" className="text-xs text-ember hover:underline flex items-center gap-1">
              Spesa <ArrowRight className="w-3 h-3" />
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
                Prossimo in programma
                {nextTimeline.phase && (
                  <span className="ml-2 normal-case tracking-normal text-cream/45">
                    · {PHASE_LABELS[nextTimeline.phase]}
                  </span>
                )}
              </p>
              <p className="font-[family-name:var(--font-fraunces)] text-lg">
                {nextTimeline.time_note}
              </p>
              <p className="text-cream/70 text-sm mt-0.5">{nextTimeline.description}</p>
              <p className="text-cream/40 text-xs mt-1">
                {nextTimeline.event_date
                  ? scheduleEntryLabel(nextTimeline.event_date, nextTimeline.day_label)
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
