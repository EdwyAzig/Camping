export const LOCALES = ["it", "en", "ro"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "it";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function localeToIntl(locale: Locale): string {
  const map: Record<Locale, string> = {
    it: "it-IT",
    en: "en-GB",
    ro: "ro-RO",
  };
  return map[locale];
}
