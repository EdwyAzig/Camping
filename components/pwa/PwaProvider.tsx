"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type BeforeInstallPromptEvent,
  canShowInstallUi,
  dismissInstallPrompt,
  isIosDevice,
  isStandaloneDisplay,
  wasInstallDismissed,
} from "@/lib/pwa";
import { InstallAppBanner } from "@/components/pwa/InstallAppBanner";

type PwaContextValue = {
  isStandalone: boolean;
  isIos: boolean;
  canInstall: boolean;
  install: () => Promise<boolean>;
  dismissInstall: () => void;
  splashDone: boolean;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    throw new Error("usePwa must be used within PwaProvider");
  }
  return ctx;
}

export function useOptionalPwa() {
  return useContext(PwaContext);
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setIos(isIosDevice());
    setDismissed(wasInstallDismissed());

    if (isStandaloneDisplay()) {
      document.documentElement.classList.add("standalone-app");
    }

    const registerSw = () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      }
    };

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onSplashDone = () => {
      setSplashDone(true);
      const scheduleSw = () => registerSw();
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(scheduleSw, { timeout: 3000 });
      } else {
        globalThis.setTimeout(scheduleSw, 800);
      }
    };

    const splashTimer = window.setTimeout(onSplashDone, 2800);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("camply:splash-done", onSplashDone, { once: true });

    return () => {
      window.clearTimeout(splashTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("camply:splash-done", onSplashDone);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      dismissInstallPrompt();
      setDismissed(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => {
    dismissInstallPrompt();
    setDismissed(true);
  }, []);

  const canInstall = useMemo(() => {
    if (standalone || dismissed) return false;
    if (deferredPrompt) return true;
    return ios && canShowInstallUi();
  }, [deferredPrompt, dismissed, ios, standalone]);

  const value = useMemo(
    () => ({
      isStandalone: standalone,
      isIos: ios,
      canInstall,
      install,
      dismissInstall,
      splashDone,
    }),
    [canInstall, dismissInstall, install, ios, splashDone, standalone]
  );

  return (
    <PwaContext.Provider value={value}>
      {children}
      {splashDone && canInstall && <InstallAppBanner />}
    </PwaContext.Provider>
  );
}
