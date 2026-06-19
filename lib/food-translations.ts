import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";

function getFoodCategories(locale: Locale): Record<string, string> {
  const messages = getMessages(locale);
  const categories = messages.foodCategories;
  if (!categories || typeof categories !== "object") return {};
  return categories as Record<string, string>;
}

export function translateFoodType(
  raw: string | null | undefined,
  locale: Locale = "it"
): string | null {
  if (!raw?.trim()) return null;
  const map = getFoodCategories(locale);
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  if (map[key]) return map[key];
  const partial = Object.entries(map).find(([en]) => key.includes(en));
  return partial?.[1] ?? null;
}

export function tagToLabel(tag: string, locale: Locale = "it"): string {
  const lang = tag.split(":")[0];
  const label = tag.split(":").pop()?.replace(/-/g, " ").trim() ?? "";
  if (!label || label.length < 3) return "";
  if (["en", "fr", "de", "es", "it", "ro", "world"].includes(lang)) {
    const translated = translateFoodType(label, locale);
    if (translated) return translated;
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const LOCALE_WORDS: Record<Locale, RegExp> = {
  it: /\b(pasta|latte|acqua|pane|formaggio|yogurt|olio|riso|carne|pesce|frutta|verdura|bevanda|biscotti|cioccolato|marmellata|zucchero|sale|farina|salsa|snack|gelato|birra|vino|caffè|tè|gusto|classico|integrale|bio|naturale|fresco|italiano|italiana)\b/i,
  en: /\b(pasta|milk|water|bread|cheese|yogurt|oil|rice|meat|fish|fruit|vegetable|drink|biscuit|chocolate|jam|sugar|salt|flour|sauce|snack|ice|beer|wine|coffee|tea|classic|organic|natural|fresh)\b/i,
  ro: /\b(pastă|lapte|apă|pâine|brânză|iaurt|ulei|orez|carne|pește|fruct|legum|băutur|biscui|ciocolat|gem|zahăr|sare|făină|sos|snack|înghețat|bere|vin|cafea|ceai|clasic|bio|natural|proaspăt)\b/i,
};

export function looksLikeLocale(text: string, locale: Locale): boolean {
  if (/[àèéìòùăâîșț]/i.test(text)) return locale !== "en";
  return LOCALE_WORDS[locale]?.test(text) ?? false;
}

/** @deprecated Use looksLikeLocale(text, "it") */
export function looksItalian(text: string): boolean {
  return looksLikeLocale(text, "it");
}

export function getProductFallbackName(barcode: string, locale: Locale): string {
  return createTranslator(getMessages(locale))("common.productWithBarcode", { barcode });
}
