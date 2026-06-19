"use client";

import { Check, Download, Share, Smartphone } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "@/lib/i18n/client";
import { useOptionalPwa } from "@/components/pwa/PwaProvider";

export function InstallAppSettings() {
  const { t } = useTranslations();
  const pwa = useOptionalPwa();

  if (!pwa) return null;

  const { isStandalone, isIos, canInstall, install } = pwa;

  return (
    <Card className="animate-fade-up animate-fade-up-delay-2">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-ember/15 shrink-0">
          <Smartphone className="w-5 h-5 text-ember" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle>{t("pwa.settingsTitle")}</CardTitle>
          <CardDescription className="mt-1">{t("pwa.settingsDescription")}</CardDescription>
        </div>
      </div>

      {isStandalone ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-300 bg-green-900/25 border border-green-800/40 rounded-xl px-3 py-2.5">
          <Check className="w-4 h-4 shrink-0" />
          {t("pwa.alreadyInstalled")}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {isIos ? (
            <ol className="text-sm text-cream/65 space-y-2 list-decimal list-inside">
              <li>{t("pwa.iosStep1")}</li>
              <li>{t("pwa.iosStep2")}</li>
              <li>{t("pwa.iosStep3")}</li>
            </ol>
          ) : (
            <p className="text-sm text-cream/65">{t("pwa.installAndroidHint")}</p>
          )}

          {!isIos && canInstall && (
            <Button type="button" className="w-full sm:w-auto" onClick={() => void install()}>
              <Download className="w-4 h-4" />
              {t("pwa.installAction")}
            </Button>
          )}

          {isIos && (
            <div className="inline-flex items-center gap-2 text-sm text-ember px-3 py-2 rounded-xl bg-ember/10 border border-ember/25">
              <Share className="w-4 h-4" />
              {t("pwa.iosShare")}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
