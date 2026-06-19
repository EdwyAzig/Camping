import type { Locale } from "@/lib/i18n/config";

export function googleMapsEmbedUrl(
  lat: number,
  lng: number,
  locationName?: string,
  locale: Locale = "it"
): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const query = locationName
    ? encodeURIComponent(`${locationName}@${lat},${lng}`)
    : `${lat},${lng}`;

  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${query}&zoom=15&language=${locale}`;
  }

  return `https://maps.google.com/maps?q=${lat},${lng}&hl=${locale}&z=15&output=embed`;
}

export function googleMapsOpenUrl(
  lat: number,
  lng: number,
  shareUrl?: string
): string {
  return shareUrl ?? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function normalizeMapLink(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
