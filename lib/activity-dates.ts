import type { Locale } from "@/lib/i18n/config";
import { formatDateShort } from "@/lib/dates";
import type { Activity, ScheduleEntry } from "@/lib/types";

export const NO_ACTIVITY_DATE = "__no_date__";

export function formatActivitySchedule(activity: Activity, locale: Locale = "it"): string {
  if (activity.event_date) {
    const datePart = formatDateShort(activity.event_date, locale);
    return activity.scheduled_time ? `${datePart} · ${activity.scheduled_time}` : datePart;
  }
  return activity.scheduled_time;
}

export function resolveActivityDateKey(
  activity: Activity,
  scheduleEntries: ScheduleEntry[]
): string {
  if (activity.event_date) return activity.event_date;

  const time = activity.scheduled_time?.trim();
  if (!time) return NO_ACTIVITY_DATE;

  const timelineEntries = scheduleEntries.filter(
    (e) => e.entry_type === "timeline" && e.event_date && e.time_note
  );

  const exactMatch = timelineEntries.find((e) => e.time_note === time);
  if (exactMatch?.event_date) return exactMatch.event_date;

  const timeLower = time.toLowerCase();
  const partialMatch = timelineEntries.find((e) => {
    const note = e.time_note.toLowerCase();
    return note.includes(timeLower) || timeLower.includes(note);
  });
  return partialMatch?.event_date ?? NO_ACTIVITY_DATE;
}
