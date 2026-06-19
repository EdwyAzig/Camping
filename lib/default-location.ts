/** Parco del Gravio — Riverside Outdoor, Condove (TO) */
export const DEFAULT_CAMPING_LOCATION = {
  lat: 45.1163418,
  lng: 7.2956743,
  mapsUrl: "https://maps.app.goo.gl/upeih1rPfW4gsmpo7",
} as const;

export function isDefaultCampingLocation(lat: number, lng: number): boolean {
  return (
    Math.abs(lat - DEFAULT_CAMPING_LOCATION.lat) < 0.02 &&
    Math.abs(lng - DEFAULT_CAMPING_LOCATION.lng) < 0.02
  );
}

export function getTripMapsUrl(trip: { lat: number; lng: number }): string | undefined {
  return isDefaultCampingLocation(trip.lat, trip.lng)
    ? DEFAULT_CAMPING_LOCATION.mapsUrl
    : undefined;
}
