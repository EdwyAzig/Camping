"use client";

import { useMemo, useState } from "react";
import { Plus, Car, Tent, Home, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { formatDateShort } from "@/lib/dates";
import { detectPhase, TRIP_PHASES } from "@/lib/trip-phases";
import { normalizeMapLink } from "@/lib/google-maps";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/client";
import { getActivityDifficultyOptions, getPhaseLabel } from "@/lib/i18n/enums";
import type { ActivityDifficulty, ScheduleEntry, TripPhase } from "@/lib/types";

const PHASE_ICONS: Record<TripPhase, typeof Car> = {
  partenza: Car,
  soggiorno: Tent,
  ritorno: Home,
  generale: Clock,
};

function formatScheduleSlot(entry: ScheduleEntry, locale: import("@/lib/i18n/config").Locale) {
  const datePart = entry.event_date
    ? formatDateShort(entry.event_date, locale)
    : entry.day_label;
  const parts = [datePart, entry.time_note].filter(Boolean);
  return parts.join(" · ");
}

interface ActivityFormProps {
  tripId: string;
  scheduleEntries: ScheduleEntry[];
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  defaultEventDate?: string;
  onAdded: () => void;
}

export function ActivityForm({
  tripId,
  scheduleEntries,
  tripStartDate,
  tripEndDate,
  defaultEventDate = "",
  onAdded,
}: ActivityFormProps) {
  const { locale, t } = useTranslations();
  const difficultyOptions = getActivityDifficultyOptions(t);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [eventDate, setEventDate] = useState(defaultEventDate);
  const [scheduledTime, setScheduledTime] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [difficulty, setDifficulty] = useState<ActivityDifficulty>("facile");
  const [phase, setPhase] = useState<TripPhase>("soggiorno");

  const timeSuggestions = useMemo(() => {
    return scheduleEntries
      .filter((e) => e.entry_type === "timeline" && (e.phase ?? "soggiorno") === phase)
      .map((e) => formatScheduleSlot(e, locale));
  }, [scheduleEntries, phase, locale]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const supabase = createClient();
    const resolvedPhase = phase !== "generale" ? phase : detectPhase(`${name} ${description}`);
    await supabase.from("activities").insert({
      trip_id: tripId,
      name: name.trim(),
      description: description.trim(),
      estimated_cost: cost ? parseFloat(cost) : null,
      event_date: eventDate || null,
      scheduled_time: scheduledTime.trim(),
      map_link: normalizeMapLink(mapLink),
      difficulty,
      phase: resolvedPhase === "generale" ? "soggiorno" : resolvedPhase,
    });
    setName("");
    setDescription("");
    setCost("");
    setScheduledTime("");
    setMapLink("");
    onAdded();
  }

  return (
    <form onSubmit={handleAdd} className="space-y-3">
      <div>
        <Label>{t("activities.tripPhase")}</Label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {TRIP_PHASES.filter((p) => p !== "generale").map((p) => {
            const Icon = PHASE_ICONS[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPhase(p)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors",
                  phase === p
                    ? "bg-ember/20 border-ember/50 text-ember"
                    : "bg-night/40 border-glass-border text-cream/60 hover:text-cream"
                )}
              >
                <Icon className="w-3 h-3" />
                {getPhaseLabel(p, t)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>{t("activities.name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("activities.namePlaceholder")}
          />
        </div>
        <div>
          <Label>{t("activities.date")}</Label>
          <Input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            min={tripStartDate || undefined}
            max={tripEndDate || undefined}
          />
          {eventDate && (
            <p className="text-xs text-cream/45 mt-1">{formatDateShort(eventDate, locale)}</p>
          )}
          {tripStartDate && tripEndDate && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[tripStartDate, tripEndDate]
                .filter((d, i, arr) => arr.indexOf(d) === i)
                .map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setEventDate(d)}
                    className="text-[10px] px-2 py-0.5 rounded bg-night/50 border border-glass-border text-cream/50 hover:text-ember hover:border-ember/30"
                  >
                    {formatDateShort(d, locale)}
                  </button>
                ))}
            </div>
          )}
        </div>
        <div>
          <Label>{t("activities.time")}</Label>
          <Input
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            placeholder={t("activities.timePlaceholder")}
          />
          {timeSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {timeSuggestions.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    const parts = slot.split(" · ");
                    if (parts.length > 1) setScheduledTime(parts.slice(1).join(" · "));
                    else setScheduledTime(slot);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded bg-night/50 border border-glass-border text-cream/50 hover:text-ember hover:border-ember/30"
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>{t("activities.costEuro")}</Label>
          <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div>
          <Label>{t("activities.difficulty")}</Label>
          <Select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as ActivityDifficulty)}
          >
            {difficultyOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label>{t("activities.description")}</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <Label>{t("activities.mapsLink")}</Label>
        <Input
          type="url"
          value={mapLink}
          onChange={(e) => setMapLink(e.target.value)}
          placeholder={t("activities.mapsLinkPlaceholderLong")}
        />
      </div>
      <Button type="submit">
        <Plus className="w-4 h-4" /> {t("activities.addActivity")}
      </Button>
    </form>
  );
}
