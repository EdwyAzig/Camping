const IT_DAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"] as const;
const IT_MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"] as const;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function dayLabelFromDate(iso: string): string {
  return capitalize(IT_DAYS[parseISODate(iso).getDay()]);
}

export function formatItalianDate(iso: string): string {
  const d = parseISODate(iso);
  return `${capitalize(IT_DAYS[d.getDay()])} ${d.getDate()} ${IT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatItalianDateShort(iso: string): string {
  const d = parseISODate(iso);
  const shortDay = capitalize(IT_DAYS[d.getDay()].slice(0, 3));
  return `${shortDay} ${d.getDate()} ${IT_MONTHS[d.getMonth()]}`;
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "";
  if (start && end && start !== end) {
    return `${formatItalianDateShort(start)} → ${formatItalianDateShort(end)}`;
  }
  if (start) return formatItalianDate(start);
  if (end) return formatItalianDate(end);
  return "";
}

/** Prossima domenica e lunedì (weekend classico) */
export function defaultWeekendDates(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + daysUntilSunday);
  const monday = new Date(sunday);
  monday.setDate(sunday.getDate() + 1);
  return { start: toISODate(sunday), end: toISODate(monday) };
}

export function scheduleEntryLabel(eventDate: string | null, dayLabel: string): string {
  if (eventDate) return formatItalianDate(eventDate);
  return dayLabel || "Senza data";
}

export function countNights(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const diff = Math.round(
    (parseISODate(end).getTime() - parseISODate(start).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(diff, 0);
}

export function compareEventDates(a: string | null, b: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

/** Prossimo evento timeline con data >= oggi */
export function getNextTimelineEntry<T extends {
  entry_type: string;
  event_date: string | null;
  sort_order: number;
}>(entries: T[], todayISO?: string): T | null {
  const today = todayISO ?? toISODate(new Date());
  const upcoming = entries
    .filter((e) => e.entry_type === "timeline" && e.event_date && e.event_date >= today)
    .sort((a, b) => {
      const dateCmp = compareEventDates(a.event_date, b.event_date);
      if (dateCmp !== 0) return dateCmp;
      return a.sort_order - b.sort_order;
    });
  return upcoming[0] ?? null;
}
