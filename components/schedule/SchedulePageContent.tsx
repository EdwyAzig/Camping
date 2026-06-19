"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, MessageCircle, Clock, Car, Tent, Home, MapPin, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ItemActions } from "@/components/ui/ItemActions";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { cn } from "@/lib/utils";
import {
  addDays,
  dayLabelFromDate,
  formatDateLong,
  formatDateRange,
  formatDateShort,
} from "@/lib/dates";
import {
  detectPhase,
  getNaturalPhraseSuggestions,
  getTimelinePresets,
  TRIP_PHASES,
  type TimelinePreset,
} from "@/lib/trip-phases";
import { NO_ACTIVITY_DATE, resolveActivityDateKey } from "@/lib/activity-dates";
import { useTranslations, useFormatEuro } from "@/lib/i18n/client";
import { getPhaseLabel } from "@/lib/i18n/enums";
import type { ActivityWithDetails, ScheduleEntry, ScheduleEntryType, Trip, TripMember, TripPhase } from "@/lib/types";

const PHASE_ICONS: Record<TripPhase, typeof Car> = {
  partenza: Car,
  soggiorno: Tent,
  ritorno: Home,
  generale: Clock,
};

export function SchedulePageContent({
  tripId,
  trip: initialTrip,
  members,
  userId,
  initialEntries,
  initialActivities = [],
}: {
  tripId: string;
  trip: Trip;
  members: TripMember[];
  userId: string;
  initialEntries: ScheduleEntry[];
  initialActivities?: ActivityWithDetails[];
}) {
  const { locale, t } = useTranslations();
  const formatEuro = useFormatEuro();
  const timelinePresets = useMemo(() => getTimelinePresets(t), [t]);
  const naturalPhraseSuggestions = useMemo(() => getNaturalPhraseSuggestions(t), [t]);
  const [trip, setTrip] = useState(initialTrip);
  const [entries, setEntries] = useState(initialEntries);
  const [activities, setActivities] = useState(initialActivities);
  const [entryType, setEntryType] = useState<ScheduleEntryType>("natural");
  const [phase, setPhase] = useState<TripPhase>("soggiorno");
  const [eventDate, setEventDate] = useState(initialTrip.start_date ?? "");
  const [timeNote, setTimeNote] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(initialTrip.start_date ?? "");
  const [endDate, setEndDate] = useState(initialTrip.end_date ?? "");
  const [savingDates, setSavingDates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editTimeNote, setEditTimeNote] = useState("");
  const [editPhase, setEditPhase] = useState<TripPhase>("soggiorno");
  const [editIsTimeline, setEditIsTimeline] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: tripData }, { data: scheduleData }, { data: activityData }] = await Promise.all([
      supabase.from("trips").select("*").eq("id", tripId).single(),
      supabase.from("schedule_entries").select("*").eq("trip_id", tripId).order("sort_order"),
      supabase
        .from("activities")
        .select("*, activity_participants(user_id), activity_votes(user_id, rating)")
        .eq("trip_id", tripId)
        .order("created_at"),
    ]);
    if (tripData) {
      const tripRecord = tripData as Trip;
      setTrip(tripRecord);
      setStartDate(tripRecord.start_date ?? "");
      setEndDate(tripRecord.end_date ?? "");
      if (!eventDate && tripRecord.start_date) setEventDate(tripRecord.start_date);
    }
    if (scheduleData) setEntries(scheduleData as ScheduleEntry[]);
    if (activityData) setActivities(activityData as ActivityWithDetails[]);
  }, [tripId]);

  useRealtimeTable("schedule_entries", tripId, load);
  useRealtimeTable("activities", tripId, load);
  useRealtimeTable("activity_votes", null, load, { noFilter: true });

  useEffect(() => {
    if (!description.trim()) return;
    const detected = detectPhase(description);
    if (detected !== "generale") setPhase(detected);
  }, [description]);

  const natural = entries.filter((e) => e.entry_type === "natural");
  const timeline = useMemo(
    () => entries.filter((e) => e.entry_type === "timeline"),
    [entries]
  );

  const activitiesByDate = useMemo(() => {
    const map = new Map<string, ActivityWithDetails[]>();
    for (const a of activities) {
      const key = resolveActivityDateKey(a, entries);
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [activities, entries]);

  const calendarDays = useMemo(() => {
    const keys = new Set<string>();
    for (const entry of timeline) {
      if (entry.event_date) keys.add(entry.event_date);
    }
    for (const key of activitiesByDate.keys()) {
      if (key !== NO_ACTIVITY_DATE) keys.add(key);
    }
    return [...keys]
      .sort()
      .map((key) => ({
        key,
        label: formatDateLong(key, locale),
        items: timeline
          .filter((e) => e.event_date === key)
          .sort((a, b) => a.sort_order - b.sort_order),
      }));
  }, [timeline, activitiesByDate, locale]);

  const unscheduledActivities = activitiesByDate.get(NO_ACTIVITY_DATE) ?? [];
  const activitiesTotal = activities.reduce((s, a) => s + (a.estimated_cost ?? 0), 0);

  async function saveTripDates() {
    if (!startDate) return;
    setSavingDates(true);
    const supabase = createClient();
    const resolvedEnd = endDate || addDays(startDate, 1);
    const { data } = await supabase
      .from("trips")
      .update({
        start_date: startDate,
        end_date: resolvedEnd,
        departure_date: formatDateShort(startDate, locale),
        return_note: formatDateShort(resolvedEnd, locale),
      })
      .eq("id", tripId)
      .select()
      .single();
    if (data) {
      setTrip(data as Trip);
      setEndDate(resolvedEnd);
      if (!eventDate) setEventDate(startDate);
    }
    setSavingDates(false);
  }

  function resolvePresetDate(preset: TimelinePreset): string | null {
    const base = startDate || trip.start_date;
    if (!base) return null;
    if (preset.phase === "ritorno") {
      return endDate || trip.end_date || addDays(base, preset.dayOffset);
    }
    return addDays(base, preset.dayOffset);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    if (entryType === "timeline" && !eventDate) return;

    const supabase = createClient();
    const maxOrder = entries.reduce((m, x) => Math.max(m, x.sort_order), 0);
    const resolvedPhase = entryType === "natural" ? detectPhase(description) : phase;
    const isoDate = entryType === "timeline" ? eventDate : null;

    await supabase.from("schedule_entries").insert({
      trip_id: tripId,
      day_label: isoDate ? dayLabelFromDate(isoDate, locale) : t("common.general"),
      event_date: isoDate,
      time_note: timeNote.trim(),
      description: description.trim(),
      entry_type: entryType,
      phase: resolvedPhase,
      sort_order: maxOrder + 1,
    });
    setDescription("");
    setTimeNote("");
    load();
  }

  async function applyPreset(preset: TimelinePreset) {
    const isoDate = resolvePresetDate(preset);
    if (!isoDate) return;

    const supabase = createClient();
    const maxOrder = entries.reduce((m, x) => Math.max(m, x.sort_order), 0);
    await supabase.from("schedule_entries").insert({
      trip_id: tripId,
      day_label: dayLabelFromDate(isoDate, locale),
      event_date: isoDate,
      time_note: preset.time_note,
      description: preset.description,
      entry_type: "timeline",
      phase: preset.phase,
      sort_order: maxOrder + 1,
    });
    load();
  }

  async function deleteEntry(id: string) {
    const supabase = createClient();
    await supabase.from("schedule_entries").delete().eq("id", id);
    if (editingId === id) setEditingId(null);
    load();
  }

  function startEdit(entry: ScheduleEntry) {
    setEditingId(entry.id);
    setEditDescription(entry.description);
    setEditEventDate(entry.event_date ?? "");
    setEditTimeNote(entry.time_note);
    setEditPhase(entry.phase ?? detectPhase(entry.description));
    setEditIsTimeline(entry.entry_type === "timeline");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!editingId || !editDescription.trim()) return;
    const supabase = createClient();
    const resolvedPhase = editIsTimeline ? editPhase : detectPhase(editDescription);
    await supabase
      .from("schedule_entries")
      .update({
        description: editDescription.trim(),
        event_date: editIsTimeline && editEventDate ? editEventDate : null,
        day_label: editIsTimeline && editEventDate ? dayLabelFromDate(editEventDate, locale) : t("common.general"),
        time_note: editTimeNote.trim(),
        phase: resolvedPhase,
      })
      .eq("id", editingId);
    setEditingId(null);
    load();
  }

  function renderEntryActions(entryId: string) {
    if (editingId === entryId) {
      return (
        <ItemActions
          editing
          onEdit={() => {}}
          onDelete={() => deleteEntry(entryId)}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
      );
    }
    return (
      <ItemActions
        onEdit={() => startEdit(entries.find((e) => e.id === entryId)!)}
        onDelete={() => deleteEntry(entryId)}
      />
    );
  }

  const tripRange = formatDateRange(trip.start_date, trip.end_date, locale);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("schedule.title")}
        description={
          tripRange
            ? t("schedule.descriptionWithDates", { range: tripRange, amount: formatEuro(activitiesTotal) })
            : t("schedule.descriptionNoDates")
        }
        icon={Clock}
        badge={t("schedule.badge")}
      />

      <Card className="border-ember/20">
        <CardTitle className="text-base flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-ember" />
          {t("schedule.tripDates")}
        </CardTitle>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div>
            <Label>{t("schedule.departure")}</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            {startDate && <p className="text-xs text-cream/45 mt-1">{formatDateLong(startDate, locale)}</p>}
          </div>
          <div>
            <Label>{t("schedule.return")}</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} />
            {endDate && <p className="text-xs text-cream/45 mt-1">{formatDateLong(endDate, locale)}</p>}
          </div>
          <Button type="button" onClick={saveTripDates} disabled={!startDate || savingDates}>
            {savingDates ? t("common.saving") : t("schedule.saveDates")}
          </Button>
        </div>
        {!startDate && (
          <p className="text-xs text-amber-200/80 mt-3">
            {t("schedule.setDepartureHint")}
          </p>
        )}
      </Card>

      {natural.length > 0 && (
        <section>
          <CardTitle className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-ember" />
            {t("schedule.inSummary")}
          </CardTitle>
          <ul className="space-y-2">
            {natural.map((entry) => {
              const entryPhase = entry.phase ?? detectPhase(entry.description);
              const Icon = PHASE_ICONS[entryPhase];
              return (
                <li key={entry.id}>
                  <Card className="p-4 flex flex-col sm:flex-row sm:justify-between gap-3 border-ember/10">
                    <div className="flex gap-3 min-w-0 flex-1">
                      {editingId !== entry.id && (
                        <span className="shrink-0 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-ember/70 px-2 py-1 rounded-full bg-ember/10 border border-ember/20 h-fit">
                          <Icon className="w-3 h-3" />
                          {getPhaseLabel(entryPhase, t)}
                        </span>
                      )}
                      {editingId === entry.id ? (
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="flex-1 text-sm min-h-[60px]"
                        />
                      ) : (
                        <p className="text-cream italic">&ldquo;{entry.description}&rdquo;</p>
                      )}
                    </div>
                    {renderEntryActions(entry.id)}
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-ember" />
            {t("schedule.calendar")}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {timelinePresets.map((preset) => {
              const Icon = PHASE_ICONS[preset.phase];
              const presetDate = resolvePresetDate(preset);
              return (
                <button
                  key={`${preset.phase}-${preset.dayOffset}-${preset.time_note}`}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  disabled={!presetDate}
                  title={presetDate ? formatDateShort(presetDate, locale) : t("schedule.presetDatesRequired")}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-night/40 border border-glass-border text-cream/60 hover:text-cream hover:border-ember/30 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon className="w-3 h-3 text-ember/70" />
                  {preset.description}
                </button>
              );
            })}
          </div>
        </div>

        {calendarDays.length === 0 ? (
          <Card className="p-6 text-center text-cream/50 text-sm">
            {t("schedule.emptyCalendar")}
          </Card>
        ) : (
          <div className="space-y-6">
            {calendarDays.map(({ key, label, items }) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-ember" />
                  <h3 className="text-sm font-medium text-ember">{label}</h3>
                  <span className="text-xs text-cream/40">{dayLabelFromDate(key, locale)}</span>
                </div>
                {items.length > 0 && (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-ember/30 hidden sm:block" />
                  <ul className="space-y-3">
                    {items.map((entry) => {
                      const entryPhase = entry.phase ?? "soggiorno";
                      const PhaseIcon = PHASE_ICONS[entryPhase];
                      return (
                        <li key={entry.id} className="relative sm:pl-10">
                          <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full bg-ember border-2 border-night hidden sm:block" />
                          <Card className="p-4 flex flex-col sm:flex-row sm:justify-between gap-3">
                            {editingId === entry.id ? (
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {TRIP_PHASES.filter((p) => p !== "generale").map((p) => {
                                    const PIcon = PHASE_ICONS[p];
                                    return (
                                      <button
                                        key={p}
                                        type="button"
                                        onClick={() => setEditPhase(p)}
                                        className={cn(
                                          "text-xs px-2 py-1 rounded-lg border flex items-center gap-1",
                                          editPhase === p ? "bg-ember/20 border-ember/50 text-ember" : "border-glass-border text-cream/50"
                                        )}
                                      >
                                        <PIcon className="w-3 h-3" />
                                        {getPhaseLabel(p, t)}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="grid sm:grid-cols-2 gap-2">
                                  <Input type="date" value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} className="text-sm" />
                                  <Input value={editTimeNote} onChange={(e) => setEditTimeNote(e.target.value)} placeholder={t("schedule.timeInputPlaceholder")} className="text-sm" />
                                </div>
                                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder={t("schedule.whatHappensInputPlaceholder")} className="text-sm" />
                              </div>
                            ) : (
                              <div>
                                <div className="flex flex-wrap items-center gap-2 text-sm mb-1">
                                  <span className="text-ember font-medium">{entry.time_note || t("common.dash")}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-ember/10 border border-ember/20 text-ember/70 flex items-center gap-1">
                                    <PhaseIcon className="w-3 h-3" />
                                    {getPhaseLabel(entryPhase, t)}
                                  </span>
                                </div>
                                <p>{entry.description}</p>
                                {!entry.event_date && entry.day_label && (
                                  <p className="text-xs text-amber-200/60 mt-1">
                                    {t("schedule.oldLabelWarning", { label: entry.day_label })}
                                  </p>
                                )}
                              </div>
                            )}
                            {renderEntryActions(entry.id)}
                          </Card>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                )}
                {(activitiesByDate.get(key) ?? []).length > 0 && (
                  <div className="mt-3 ml-0 sm:ml-10 space-y-3">
                    <p className="text-xs text-cream/45 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t("schedule.activities")}
                    </p>
                    <ul className="space-y-3">
                      {(activitiesByDate.get(key) ?? []).map((a) => (
                        <li key={a.id}>
                          <ActivityCard
                            activity={a}
                            members={members}
                            userId={userId}
                            scheduleEntries={entries}
                            tripStartDate={startDate || trip.start_date}
                            tripEndDate={endDate || trip.end_date}
                            compact
                            onChanged={load}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {unscheduledActivities.length > 0 && (
        <section>
          <CardTitle className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-emerald-300" />
            {t("schedule.activitiesNoDate")}
          </CardTitle>
          <ul className="space-y-3">
            {unscheduledActivities.map((a) => (
              <li key={a.id}>
                <ActivityCard
                  activity={a}
                  members={members}
                  userId={userId}
                  scheduleEntries={entries}
                  tripStartDate={startDate || trip.start_date}
                  tripEndDate={endDate || trip.end_date}
                  onChanged={load}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle className="text-base mb-4">{t("schedule.addEvent")}</CardTitle>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-2">
            <Button type="button" variant={entryType === "natural" ? "primary" : "secondary"} size="sm" onClick={() => setEntryType("natural")}>
              {t("schedule.naturalPhrase")}
            </Button>
            <Button type="button" variant={entryType === "timeline" ? "primary" : "secondary"} size="sm" onClick={() => setEntryType("timeline")}>
              {t("schedule.calendarEvent")}
            </Button>
          </div>

          {entryType === "timeline" && (
            <>
              <div>
                <Label>{t("schedule.tripPhase")}</Label>
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
                  <Label>{t("common.date")}</Label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    min={startDate || undefined}
                    max={endDate || undefined}
                    required
                  />
                  {eventDate && <p className="text-xs text-cream/45 mt-1">{formatDateLong(eventDate, locale)}</p>}
                </div>
                <div>
                  <Label>{t("common.time")}</Label>
                  <Input value={timeNote} onChange={(e) => setTimeNote(e.target.value)} placeholder={t("schedule.timePlaceholder")} />
                </div>
              </div>
              {startDate && endDate && (
                <div className="flex flex-wrap gap-2">
                  {[startDate, endDate].filter((d, i, arr) => arr.indexOf(d) === i).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setEventDate(d)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-night/40 border border-glass-border text-cream/60 hover:text-cream"
                    >
                      {formatDateShort(d, locale)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div>
            <Label>{entryType === "natural" ? t("schedule.phraseLabel") : t("schedule.whatHappensLabel")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={entryType === "natural" ? t("schedule.naturalPhrasePlaceholder") : t("schedule.timelinePlaceholder")}
            />
            {entryType === "natural" && description.trim() && (
              <p className="text-xs text-cream/45 mt-1">
                {t("common.classifiedAs", { phase: getPhaseLabel(detectPhase(description), t) })}
              </p>
            )}
          </div>

          {entryType === "natural" && (
            <div className="flex flex-wrap gap-2">
              {naturalPhraseSuggestions.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => {
                    setDescription(s.text);
                    setPhase(s.phase);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-night/40 border border-glass-border text-cream/60 hover:text-cream"
                >
                  {s.text}
                </button>
              ))}
            </div>
          )}

          <Button type="submit" disabled={entryType === "timeline" && !eventDate}>
            <Plus className="w-4 h-4" /> {t("schedule.addEventButton")}
          </Button>
        </form>
      </Card>

        <Card>
          <CardTitle className="text-base mb-4">{t("schedule.addActivity")}</CardTitle>
          <ActivityForm
            tripId={tripId}
            scheduleEntries={entries}
            tripStartDate={startDate || trip.start_date}
            tripEndDate={endDate || trip.end_date}
            defaultEventDate={eventDate}
            onAdded={load}
          />
        </Card>
      </div>
    </div>
  );
}
