"use client";

import { useState } from "react";
import { Star, Car, Tent, Home, Clock, MapPin, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ItemActions } from "@/components/ui/ItemActions";
import { formatEuro, cn } from "@/lib/utils";
import { formatItalianDateShort } from "@/lib/dates";
import { formatActivitySchedule } from "@/lib/activity-dates";
import { PHASE_LABELS, TRIP_PHASES } from "@/lib/trip-phases";
import { normalizeMapLink } from "@/lib/google-maps";
import type {
  ActivityWithDetails,
  ActivityDifficulty,
  ScheduleEntry,
  TripMember,
  TripPhase,
} from "@/lib/types";

const difficulties: ActivityDifficulty[] = ["facile", "media", "difficile"];

const PHASE_ICONS: Record<TripPhase, typeof Car> = {
  partenza: Car,
  soggiorno: Tent,
  ritorno: Home,
  generale: Clock,
};

function formatScheduleSlot(entry: ScheduleEntry) {
  const datePart = entry.event_date
    ? formatItalianDateShort(entry.event_date)
    : entry.day_label;
  const parts = [datePart, entry.time_note].filter(Boolean);
  return parts.join(" · ");
}

interface ActivityCardProps {
  activity: ActivityWithDetails;
  members: TripMember[];
  userId: string;
  scheduleEntries: ScheduleEntry[];
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  compact?: boolean;
  onChanged: () => void;
}

export function ActivityCard({
  activity,
  members,
  userId,
  scheduleEntries,
  tripStartDate,
  tripEndDate,
  compact = false,
  onChanged,
}: ActivityCardProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const [editMapLink, setEditMapLink] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<ActivityDifficulty>("facile");
  const [editPhase, setEditPhase] = useState<TripPhase>("soggiorno");

  const activityPhase = activity.phase ?? "soggiorno";
  const PhaseIcon = PHASE_ICONS[activityPhase];
  const myVote = activity.activity_votes?.find((v) => v.user_id === userId)?.rating;
  const votes = activity.activity_votes ?? [];
  const avg = votes.length
    ? (votes.reduce((s, v) => s + v.rating, 0) / votes.length).toFixed(1)
    : null;

  const timeSuggestions = scheduleEntries
    .filter((e) => e.entry_type === "timeline" && (e.phase ?? "soggiorno") === editPhase)
    .map((e) => formatScheduleSlot(e));

  function startEdit() {
    setEditName(activity.name);
    setEditDescription(activity.description);
    setEditCost(activity.estimated_cost != null ? String(activity.estimated_cost) : "");
    setEditEventDate(activity.event_date ?? "");
    setEditScheduledTime(activity.scheduled_time);
    setEditMapLink(activity.map_link ?? "");
    setEditDifficulty(activity.difficulty);
    setEditPhase(activity.phase ?? "soggiorno");
    setEditing(true);
  }

  async function saveEdit() {
    if (!editName.trim()) return;
    const supabase = createClient();
    await supabase
      .from("activities")
      .update({
        name: editName.trim(),
        description: editDescription.trim(),
        estimated_cost: editCost ? parseFloat(editCost) : null,
        event_date: editEventDate || null,
        scheduled_time: editScheduledTime.trim(),
        map_link: normalizeMapLink(editMapLink),
        difficulty: editDifficulty,
        phase: editPhase,
      })
      .eq("id", activity.id);
    setEditing(false);
    onChanged();
  }

  async function deleteActivity() {
    const supabase = createClient();
    await supabase.from("activities").delete().eq("id", activity.id);
    setEditing(false);
    onChanged();
  }

  async function setResponsible(userId: string) {
    const supabase = createClient();
    await supabase.from("activities").update({ responsible: userId || null }).eq("id", activity.id);
    onChanged();
  }

  async function toggleParticipant(uid: string) {
    const supabase = createClient();
    const isIn = activity.activity_participants?.some((p) => p.user_id === uid);
    if (isIn) {
      await supabase
        .from("activity_participants")
        .delete()
        .eq("activity_id", activity.id)
        .eq("user_id", uid);
    } else {
      await supabase
        .from("activity_participants")
        .insert({ activity_id: activity.id, user_id: uid });
    }
    onChanged();
  }

  async function vote(rating: number) {
    const supabase = createClient();
    await supabase
      .from("activity_votes")
      .upsert({ activity_id: activity.id, user_id: userId, rating });
    onChanged();
  }

  if (editing) {
    return (
      <Card className={cn(compact && "p-3")}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {TRIP_PHASES.filter((p) => p !== "generale").map((p) => {
              const Icon = PHASE_ICONS[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setEditPhase(p)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5",
                    editPhase === p
                      ? "bg-ember/20 border-ember/50 text-ember"
                      : "border-glass-border text-cream/60"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {PHASE_LABELS[p]}
                </button>
              );
            })}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={editEventDate}
                onChange={(e) => setEditEventDate(e.target.value)}
                min={tripStartDate || undefined}
                max={tripEndDate || undefined}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Orario</Label>
              <Input
                value={editScheduledTime}
                onChange={(e) => setEditScheduledTime(e.target.value)}
                placeholder="Mattina, 19:45..."
                className="text-sm"
              />
              {timeSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {timeSuggestions.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        const parts = slot.split(" · ");
                        if (parts.length > 1) setEditScheduledTime(parts.slice(1).join(" · "));
                        else setEditScheduledTime(slot);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded border border-glass-border text-cream/50 hover:text-ember"
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Costo €</Label>
              <Input
                type="number"
                step="0.01"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Difficoltà</Label>
              <Select
                value={editDifficulty}
                onChange={(e) => setEditDifficulty(e.target.value as ActivityDifficulty)}
                className="text-sm"
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Descrizione</Label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="text-sm min-h-[60px]"
            />
          </div>
          <div>
            <Label className="text-xs">Link Google Maps</Label>
            <Input
              type="url"
              value={editMapLink}
              onChange={(e) => setEditMapLink(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="text-sm"
            />
          </div>
          <div className="flex justify-end">
            <ItemActions
              editing
              onEdit={() => {}}
              onDelete={deleteActivity}
              onSave={saveEdit}
              onCancel={() => setEditing(false)}
            />
          </div>
        </div>
      </Card>
    );
  }

  const scheduleLabel = formatActivitySchedule(activity);

  return (
    <Card className={cn("border-moss/20", compact && "p-3")}>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              className={cn(
                "font-[family-name:var(--font-fraunces)]",
                compact ? "text-base" : "text-lg"
              )}
            >
              {activity.name}
            </h3>
            <span className="text-ember">{formatEuro(activity.estimated_cost)}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-night/50 border border-glass-border capitalize">
              {activity.difficulty}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-ember/10 border border-ember/20 text-ember/80 flex items-center gap-1">
              <PhaseIcon className="w-3 h-3" />
              {PHASE_LABELS[activityPhase]}
            </span>
            {scheduleLabel && <span className="text-xs text-cream/50">{scheduleLabel}</span>}
          </div>
          {activity.description && (
            <p className="text-cream/70 text-sm mt-1">{activity.description}</p>
          )}
          {activity.map_link && (
            <a
              href={normalizeMapLink(activity.map_link)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-300/90 hover:text-emerald-200 mt-2"
            >
              <MapPin className="w-3.5 h-3.5" />
              Apri posizione su Maps
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}
          {avg && (
            <p className="text-sm text-amber-300 mt-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-300" /> Voto gruppo: {avg}/5
            </p>
          )}
        </div>
        <div className="flex justify-end sm:justify-start shrink-0">
          <ItemActions onEdit={startEdit} onDelete={deleteActivity} />
        </div>
      </div>

      {!compact && (
        <>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Responsabile</Label>
              <Select
                value={activity.responsible ?? ""}
                onChange={(e) => setResponsible(e.target.value)}
                className="text-sm"
              >
                <option value="">—</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="text-xs">Il tuo voto</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => vote(r)}
                    className={cn("p-1", (myVote ?? 0) >= r ? "text-amber-300" : "text-cream/20")}
                  >
                    <Star className={cn("w-5 h-5", (myVote ?? 0) >= r && "fill-amber-300")} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-glass-border">
            <p className="text-xs text-cream/50 mb-2">Chi partecipa?</p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const active = activity.activity_participants?.some((p) => p.user_id === m.user_id);
                return (
                  <button
                    key={m.user_id}
                    onClick={() => toggleParticipant(m.user_id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm border",
                      active
                        ? "bg-ember/20 border-ember/50 text-ember"
                        : "border-glass-border text-cream/60"
                    )}
                  >
                    {m.display_name}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
