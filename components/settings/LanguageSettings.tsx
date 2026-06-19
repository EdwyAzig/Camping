"use client";

import { useEffect, useMemo } from "react";
import { Check, Globe, Loader2, Sparkles } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { suggestLocaleFromCoords } from "@/lib/i18n/detect-locale";
import { useTranslations } from "@/lib/i18n/client";
import { getLocaleLabel } from "@/lib/i18n/enums";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const LOCALE_HINTS: Record<Locale, string> = {
  it: "IT",
  en: "EN",
  ro: "RO",
};

interface LanguageSettingsProps {
  tripLat?: number;
  tripLng?: number;
}

export function LanguageSettings({ tripLat, tripLng }: LanguageSettingsProps) {
  const { locale, setLocale, saving, t } = useTranslations();

  const suggested = useMemo(() => {
    if (tripLat != null && tripLng != null) {
      const fromCoords = suggestLocaleFromCoords(tripLat, tripLng);
      if (fromCoords && fromCoords !== locale) return fromCoords;
    }
    if (typeof navigator !== "undefined") {
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith("ro") && locale !== "ro") return "ro" as Locale;
      if (lang.startsWith("en") && locale !== "en") return "en" as Locale;
      if (lang.startsWith("it") && locale !== "it") return "it" as Locale;
    }
    return null;
  }, [tripLat, tripLng, locale]);

  useEffect(() => {
    localStorage.setItem("locale", locale);
  }, [locale]);

  return (
    <div className="space-y-4 animate-fade-up animate-fade-up-delay-1">
      {suggested && (
        <Card className="border-ember/30 bg-ember/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="icon-glow shrink-0 !w-9 !h-9">
                <Sparkles className="w-4 h-4 text-ember" />
              </div>
              <p className="text-sm text-cream/80 leading-relaxed">
                {t("settings.suggestedLocale", { locale: getLocaleLabel(suggested, t) })}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setLocale(suggested)}
              disabled={saving}
              className="shrink-0 w-full sm:w-auto"
            >
              {t("settings.applySuggestion", { locale: getLocaleLabel(suggested, t) })}
            </Button>
          </div>
        </Card>
      )}

      <Card glow gradient className="p-4 sm:p-5">
        <CardTitle className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-ember" />
          {t("settings.language")}
        </CardTitle>
        <CardDescription className="mb-5">{t("settings.languageDescription")}</CardDescription>

        <div className="grid gap-2">
          {LOCALES.map((code) => {
            const active = locale === code;
            return (
              <button
                key={code}
                type="button"
                disabled={saving}
                onClick={() => setLocale(code)}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200",
                  active
                    ? "border-ember/40 bg-ember/15 shadow-[0_0_20px_rgba(232,168,56,0.08)]"
                    : "border-glass-border bg-night/20 text-cream/80 hover:border-ember/25 hover:bg-white/5"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold tracking-wide transition-colors",
                    active
                      ? "border-ember/40 bg-ember/20 text-ember"
                      : "border-glass-border bg-night/40 text-cream/45 group-hover:border-ember/20"
                  )}
                >
                  {LOCALE_HINTS[code]}
                </span>
                <span className="flex-1 min-w-0">
                  <span className={cn("block font-medium", active ? "text-ember" : "text-cream")}>
                    {getLocaleLabel(code, t)}
                  </span>
                  {active && (
                    <span className="block text-[11px] text-ember/70 mt-0.5">{t("settings.saved")}</span>
                  )}
                </span>
                <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {saving && active ? (
                    <Loader2 className="w-4 h-4 text-ember animate-spin" />
                  ) : active ? (
                    <Check className="w-4 h-4 text-ember" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
