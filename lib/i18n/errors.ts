import type { TFunction } from "@/lib/i18n/translate";

const LEGACY_ERROR_KEYS: Record<string, string> = {
  "Devi essere autenticato": "errors.mustBeAuthenticated",
  "Inserisci un codice": "errors.enterCode",
  "Codice invito non trovato": "errors.inviteNotFound",
  "Solo l'organizzatore può eliminare la sessione": "errors.onlyOrganizerCanDelete",
  "Solo l'organizzatore può eliminare questa sessione": "errors.onlyOrganizerCanDeleteTrip",
  "Sessione non trovata": "errors.sessionNotFound",
  "Errore nella creazione": "errors.createTripFailed",
};

const AUTH_ERROR_PATTERNS: { match: RegExp; key: string }[] = [
  { match: /invalid login credentials/i, key: "auth.errors.invalidCredentials" },
  { match: /email not confirmed/i, key: "auth.errors.emailNotConfirmed" },
  { match: /user already registered/i, key: "auth.errors.userAlreadyRegistered" },
  { match: /password.*at least 6/i, key: "auth.errors.weakPassword" },
  { match: /invalid email/i, key: "auth.errors.invalidEmail" },
  { match: /too many requests/i, key: "auth.errors.tooManyRequests" },
];

export function localizeError(t: TFunction, error: string): string {
  if (error.startsWith("errors.") || error.startsWith("auth.errors.")) return t(error);
  const key = LEGACY_ERROR_KEYS[error];
  if (key) return t(key);
  return error;
}

export function localizeAuthError(t: TFunction, message: string): string {
  for (const { match, key } of AUTH_ERROR_PATTERNS) {
    if (match.test(message)) return t(key);
  }
  return t("auth.errors.generic");
}
