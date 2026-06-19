import { DEFAULT_LOCALE, type Locale, isLocale } from "./config";

export function detectFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const languages = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const lang of languages) {
    if (lang.startsWith("ro")) return "ro";
    if (lang.startsWith("en")) return "en";
    if (lang.startsWith("it")) return "it";
  }

  return DEFAULT_LOCALE;
}

/** Approximate bounding boxes for locale suggestion hints only. */
export function suggestLocaleFromCoords(lat: number, lng: number): Locale | null {
  if (lat >= 43.5 && lat <= 48.5 && lng >= 20 && lng <= 30) return "ro";
  if (lat >= 36 && lat <= 47.5 && lng >= 6 && lng <= 19) return "it";
  return null;
}

export function resolveLocale(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  return detectFromAcceptLanguage(acceptLanguage);
}
