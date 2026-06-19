"use client";

import { useEffect } from "react";
import { useOptionalTranslations } from "@/lib/i18n/client";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
import { generateFireflies } from "@/lib/ambient-seed";
import { cn } from "@/lib/utils";
import { removeInstantSplash } from "@/lib/pwa";
import { CamplyLogo } from "@/components/ui/CamplyLogo";

const ORBIT_SPARKS = generateFireflies(14);

const fallbackT = createTranslator(getMessages(DEFAULT_LOCALE));

type BrandLoadingSceneProps = {
  exiting?: boolean;
  className?: string;
  label?: string;
};

function BrandLoadingBackdrop() {
  return (
    <>
      <div className="ambient-sky-gradient" />
      <div className="stars stars-layer-1" />
      <div className="stars stars-layer-2" />
      <div className="ambient-vignette" />
    </>
  );
}

export function BrandLoadingScene({ exiting = false, className, label }: BrandLoadingSceneProps) {
  const ctx = useOptionalTranslations();
  const loadingLabel = label ?? ctx?.t("common.loading") ?? fallbackT("common.loading");

  useEffect(() => {
    removeInstantSplash();
  }, []);

  return (
    <div
      className={cn(
        "brand-loading-scene",
        exiting && "brand-loading-scene-out",
        className
      )}
      aria-live="polite"
      aria-busy={!exiting}
      role="status"
    >
      <div className="brand-loading-ambient">
        <BrandLoadingBackdrop />
      </div>

      <div className="brand-loading-light" aria-hidden />

      <div className="brand-loading-orbit" aria-hidden>
        {ORBIT_SPARKS.map((spark) => (
          <span
            key={spark.id}
            className="brand-loading-spark"
            style={
              {
                "--left": `${spark.left}%`,
                "--top": `${spark.top}%`,
                "--size": `${spark.size}px`,
                "--delay": `${spark.delay}s`,
                "--duration": `${spark.duration}s`,
                "--drift": `${spark.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="brand-loading-content">
        <div className="brand-loading-logo-stage">
          <div className="brand-loading-ring brand-loading-ring-1" />
          <div className="brand-loading-ring brand-loading-ring-2" />
          <div className="brand-loading-ring brand-loading-ring-3" />
          <div className="brand-loading-flare" />
          <CamplyLogo
            className="brand-loading-logo"
            priority
            sizes="(max-width: 640px) 82vw, 18rem"
          />
        </div>

        <div className="brand-loading-progress">
          <svg
            className="brand-loading-path"
            viewBox="0 0 240 32"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="brand-path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3d6b4f" />
                <stop offset="45%" stopColor="#e8a838" />
                <stop offset="100%" stopColor="#f5c563" />
              </linearGradient>
            </defs>
            <path
              className="brand-loading-path-bg"
              d="M8 24 C 48 8, 96 28, 120 16 S 192 8, 232 20"
            />
            <path
              className="brand-loading-path-fill"
              d="M8 24 C 48 8, 96 28, 120 16 S 192 8, 232 20"
            />
          </svg>

          <div className="brand-loading-track">
            <div className="brand-loading-track-fill" />
            <span className="brand-loading-track-ember brand-loading-track-ember-1" />
            <span className="brand-loading-track-ember brand-loading-track-ember-2" />
            <span className="brand-loading-track-ember brand-loading-track-ember-3" />
          </div>

          <div className="brand-loading-dots" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="brand-loading-dot"
                style={{ "--i": i } as React.CSSProperties}
              />
            ))}
          </div>

          <p className="brand-loading-label text-shimmer">{loadingLabel}</p>
        </div>
      </div>
    </div>
  );
}
