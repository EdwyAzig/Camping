"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  isStandaloneDisplay,
  markSplashSeen,
  removeInstantSplash,
  shouldShowSplash,
} from "@/lib/pwa";

const BrandLoadingScene = dynamic(
  () =>
    import("@/components/ui/BrandLoadingScene").then((m) => m.BrandLoadingScene),
  { ssr: false }
);

const SPLASH_VISIBLE_MS = 1500;
const SPLASH_EXIT_MS = 700;
const STANDALONE_MIN_MS = 2000;
const SPLASH_MAX_MS = 3200;

export function SplashScreen() {
  const [enabled] = useState(() => shouldShowSplash());
  const [phase, setPhase] = useState<"enter" | "exit" | "done">(
    enabled ? "enter" : "done"
  );

  useEffect(() => {
    if (!enabled) {
      removeInstantSplash();
      window.dispatchEvent(new Event("camply:splash-done"));
      return;
    }

    const standalone = isStandaloneDisplay();
    let cancelled = false;
    const start = Date.now();
    const minDelay = standalone ? STANDALONE_MIN_MS : SPLASH_VISIBLE_MS;
    let domReady = document.readyState !== "loading";
    let finished = false;

    const finish = () => {
      if (cancelled || finished) return;
      if (Date.now() - start < minDelay) return;
      finished = true;
      setPhase("exit");
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase("done");
        markSplashSeen();
        removeInstantSplash();
        window.dispatchEvent(new Event("camply:splash-done"));
      }, SPLASH_EXIT_MS);
    };

    const tryFinish = () => {
      if (domReady) finish();
    };

    const onDomReady = () => {
      domReady = true;
      tryFinish();
    };

    if (domReady) {
      tryFinish();
    } else {
      document.addEventListener("DOMContentLoaded", onDomReady, { once: true });
    }

    const interval = window.setInterval(tryFinish, 80);
    const maxTimer = window.setTimeout(finish, SPLASH_MAX_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(maxTimer);
      document.removeEventListener("DOMContentLoaded", onDomReady);
    };
  }, [enabled]);

  if (phase === "done") return null;

  return <BrandLoadingScene exiting={phase === "exit"} />;
}
