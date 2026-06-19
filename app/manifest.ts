import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { getLocale, getTranslations } from "@/lib/i18n/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations();
  const locale = await getLocale();
  return {
    id: "/",
    name: BRAND.name,
    short_name: BRAND.name,
    description: t("common.appTagline"),
    start_url: "/",
    scope: "/",
    lang: locale,
    dir: "ltr",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "any",
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.themeColor,
    categories: ["lifestyle", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: BRAND.icon,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND.icon,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND.icon,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
