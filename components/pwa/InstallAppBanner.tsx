"use client";

import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/lib/i18n/client";
import { usePwa } from "@/components/pwa/PwaProvider";

export function InstallAppBanner() {
  const { t } = useTranslations();
  const { isIos, install, dismissInstall } = usePwa();

  return (
    <div className="install-banner" role="dialog" aria-label={t("pwa.installTitle")}>
      <div className="install-banner-inner">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-cream">{t("pwa.installTitle")}</p>
          <p className="text-xs text-cream/50 mt-0.5">
            {isIos ? t("pwa.installIosHint") : t("pwa.installAndroidHint")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isIos ? (
            <div className="flex items-center gap-1.5 text-xs text-ember px-3 py-2 rounded-lg bg-ember/10 border border-ember/25">
              <Share className="w-4 h-4" />
              {t("pwa.iosShare")}
            </div>
          ) : (
            <Button type="button" size="sm" onClick={() => void install()}>
              <Download className="w-4 h-4" />
              {t("pwa.installAction")}
            </Button>
          )}
          <button
            type="button"
            onClick={dismissInstall}
            className="touch-target p-2 rounded-lg text-cream/40 hover:text-cream hover:bg-white/5"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
