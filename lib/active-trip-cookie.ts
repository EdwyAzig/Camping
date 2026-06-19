export const ACTIVE_TRIP_COOKIE = "camply_active_trip";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function getActiveTripIdClient(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ACTIVE_TRIP_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function setActiveTripIdClient(tripId: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACTIVE_TRIP_COOKIE}=${encodeURIComponent(tripId)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearActiveTripIdClient(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACTIVE_TRIP_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
