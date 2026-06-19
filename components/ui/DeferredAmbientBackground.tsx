"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { shouldShowSplash } from "@/lib/pwa";

const AmbientBackground = dynamic(
  () => import("@/components/ui/AmbientBackground").then((m) => m.AmbientBackground),
  { ssr: false }
);

export function DeferredAmbientBackground() {
  const [show, setShow] = useState(() => !shouldShowSplash());

  useEffect(() => {
    if (show) return;
    const onDone = () => setShow(true);
    window.addEventListener("camply:splash-done", onDone, { once: true });
    return () => window.removeEventListener("camply:splash-done", onDone);
  }, [show]);

  if (!show) return null;
  return <AmbientBackground />;
}
