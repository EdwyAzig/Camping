"use client";

import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { InstallAppSettings } from "@/components/settings/InstallAppSettings";
import { useTranslations } from "@/lib/i18n/client";

interface SettingsPageContentProps {
  tripLat?: number;
  tripLng?: number;
}

export function SettingsPageContent({ tripLat, tripLng }: SettingsPageContentProps) {
  const { t } = useTranslations();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
        icon={Settings}
        badge={t("settings.badge")}
      />
      <LanguageSettings tripLat={tripLat} tripLng={tripLng} />
      <InstallAppSettings />
    </div>
  );
}
