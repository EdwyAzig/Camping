import type { Locale } from "@/lib/i18n/config";
import { localeToIntl } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";

export function generateInviteCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatEuro(
  amount: number | null | undefined,
  locale: Locale = "it"
): string {
  if (amount == null) {
    return createTranslator(getMessages(locale))("common.dash");
  }
  return new Intl.NumberFormat(localeToIntl(locale), {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
