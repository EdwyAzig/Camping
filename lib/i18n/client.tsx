"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { formatEuro } from "@/lib/utils";
import type { Locale } from "./config";
import { getMessages } from "./messages";
import { createTranslator, type TFunction } from "./translate";

const LOCALE_STORAGE_KEY = "locale";

interface LocaleContextValue {
  locale: Locale;
  t: TFunction;
  setLocale: (locale: Locale) => Promise<void>;
  saving: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);
  const [saving, setSaving] = useState(false);

  const t = useMemo(() => createTranslator(getMessages(locale)), [locale]);

  const setLocale = useCallback(
    async (next: Locale) => {
      if (next === locale) return;
      setSaving(true);
      try {
        const res = await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: next }),
        });
        if (!res.ok) throw new Error("Failed to set locale");
        setLocaleState(next);
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
        router.refresh();
      } finally {
        setSaving(false);
      }
    },
    [locale, router]
  );

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale, saving }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx.locale;
}

export function useFormatEuro() {
  const locale = useLocale();
  return useCallback(
    (amount: number | null | undefined) => formatEuro(amount, locale),
    [locale]
  );
}

export function useTranslations() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslations must be used within LocaleProvider");
  return ctx;
}

export function useOptionalTranslations(): LocaleContextValue | null {
  return useContext(LocaleContext);
}
