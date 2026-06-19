import { BrandLoadingScene } from "@/components/ui/BrandLoadingScene";
import { getTranslations } from "@/lib/i18n/server";

export default async function Loading() {
  const t = await getTranslations();
  return <BrandLoadingScene label={t("common.loading")} />;
}
