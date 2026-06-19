export type TripPhase = "partenza" | "soggiorno" | "ritorno" | "generale";

export const TRIP_PHASES: TripPhase[] = ["partenza", "soggiorno", "ritorno", "generale"];

export const PHASE_LABELS: Record<TripPhase, string> = {
  partenza: "Partenza",
  soggiorno: "Al campeggio",
  ritorno: "Ritorno a casa",
  generale: "Generale",
};

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
];

const RITORNO_KEYWORDS = [
  "ritorno",
  "rientro",
  "rientriamo",
  "torniamo",
  "casa",
  "fine viaggio",
  "arrivo a casa",
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

export const TIMELINE_PRESETS = [
  {
    phase: "partenza" as TripPhase,
    dayOffset: 0,
    time_note: "18:15",
    description: "Ritrovo e partenza",
  },
  {
    phase: "soggiorno" as TripPhase,
    dayOffset: 0,
    time_note: "19:00",
    description: "Arrivo in campeggio",
  },
  {
    phase: "ritorno" as TripPhase,
    dayOffset: 1,
    time_note: "14:30",
    description: "Rientro a casa",
  },
] as const;

export const NATURAL_PHRASE_SUGGESTIONS = [
  { text: "Partiamo domenica dopo le 18:00", phase: "partenza" as TripPhase },
  { text: "Rientriamo lunedì dopo pranzo", phase: "ritorno" as TripPhase },
  { text: "Se piove, spostiamo a sabato prossimo", phase: "generale" as TripPhase },
];
