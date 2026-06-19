"use client";

import { useEffect, useState } from "react";
import { BrandLoadingScene } from "@/components/ui/BrandLoadingScene";

const SPLASH_VISIBLE_MS = 2200;
const SPLASH_EXIT_MS = 900;

export function SplashScreen() {
  const [phase, setPhase] = useState<"enter" | "exit" | "done">("enter");

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setPhase("exit"), SPLASH_VISIBLE_MS);
    const doneTimer = window.setTimeout(
      () => setPhase("done"),
      SPLASH_VISIBLE_MS + SPLASH_EXIT_MS
    );
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  return <BrandLoadingScene exiting={phase === "exit"} />;
}
