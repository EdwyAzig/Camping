import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, isLocale } from "./config";
import { getMessages } from "./messages";
import { createTranslator, type TFunction } from "./translate";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getTranslations(): Promise<TFunction> {
  const locale = await getLocale();
  return createTranslator(getMessages(locale));
}

export async function getLocaleAndTranslations(): Promise<{ locale: Locale; t: TFunction }> {
  const locale = await getLocale();
  return { locale, t: createTranslator(getMessages(locale)) };
}
