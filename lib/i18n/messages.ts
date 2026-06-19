import type { Locale } from "./config";
import type { Messages } from "./types";

import it from "@/messages/it.json";
import en from "@/messages/en.json";
import ro from "@/messages/ro.json";

const dictionaries: Record<Locale, Messages> = { it, en, ro };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}
