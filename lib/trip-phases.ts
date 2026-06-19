import type { TFunction } from "@/lib/i18n/translate";

export type TripPhase = "partenza" | "soggiorno" | "ritorno" | "generale";

export const TRIP_PHASES: TripPhase[] = ["partenza", "soggiorno", "ritorno", "generale"];

export const PHASE_ORDER: Record<TripPhase, number> = {
  partenza: 0,
  soggiorno: 1,
  ritorno: 2,
  generale: 3,
};

const PARTENZA_KEYWORDS = [
  "partenza",
  "partiamo",
  "partire",
  "ritrovo",
  "via",
  "auto",
  "strada",
  "carico",
  "departure",
  "leave",
  "meet",
  "plecare",
  "plecăm",
];

const RITORNO_KEYWORDS = [
  "ritorno",
  "rientro",
  "rientriamo",
  "torniamo",
  "casa",
  "fine viaggio",
  "arrivo a casa",
  "return",
  "home",
  "întoarcere",
  "acasă",
];

const SOGGIORNO_KEYWORDS = [
  "campeggio",
  "tenda",
  "tende",
  "griglia",
  "grigliata",
  "escursione",
  "attività",
  "pranzo",
  "cena",
  "fuoco",
  "montaggio",
  "arrivo in campeggio",
  "soggiorno",
  "notte",
  "mattina",
  "pomeriggio",
  "sera",
  "campsite",
  "camp",
  "grill",
  "camping",
];

export function detectPhase(text: string): TripPhase {
  const lower = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

  if (PARTENZA_KEYWORDS.some((k) => lower.includes(k))) return "partenza";
  if (RITORNO_KEYWORDS.some((k) => lower.includes(k))) return "ritorno";
  if (SOGGIORNO_KEYWORDS.some((k) => lower.includes(k))) return "soggiorno";
  return "generale";
}

export function sortByPhase<T extends { phase: TripPhase; sort_order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const phaseDiff = PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase];
    if (phaseDiff !== 0) return phaseDiff;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

const TIMELINE_PRESET_DEFS = [
  {
    id: "presetMeetDeparture",
    phase: "partenza" as TripPhase,
    dayOffset: 0,
    time_note: "18:15",
  },
  {
    id: "presetArriveCamp",
    phase: "soggiorno" as TripPhase,
    dayOffset: 0,
    time_note: "19:00",
  },
  {
    id: "presetReturnHome",
    phase: "ritorno" as TripPhase,
    dayOffset: 1,
    time_note: "14:30",
  },
] as const;

const NATURAL_PHRASE_DEFS = [
  { id: "suggestionSundayDeparture", phase: "partenza" as TripPhase },
  { id: "suggestionMondayReturn", phase: "ritorno" as TripPhase },
  { id: "suggestionRainSaturday", phase: "generale" as TripPhase },
] as const;

export type TimelinePreset = {
  phase: TripPhase;
  dayOffset: number;
  time_note: string;
  description: string;
};

export type NaturalPhraseSuggestion = {
  text: string;
  phase: TripPhase;
};

export function getTimelinePresets(t: TFunction): TimelinePreset[] {
  return TIMELINE_PRESET_DEFS.map((preset) => ({
    phase: preset.phase,
    dayOffset: preset.dayOffset,
    time_note: preset.time_note,
    description: t(`schedule.${preset.id}`),
  }));
}

export function getNaturalPhraseSuggestions(t: TFunction): NaturalPhraseSuggestion[] {
  return NATURAL_PHRASE_DEFS.map((s) => ({
    text: t(`schedule.${s.id}`),
    phase: s.phase,
  }));
}
