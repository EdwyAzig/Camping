import { cookies } from "next/headers";
import { ACTIVE_TRIP_COOKIE } from "@/lib/active-trip-cookie";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function getActiveTripIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_TRIP_COOKIE)?.value ?? null;
}

export async function setActiveTripIdCookie(tripId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TRIP_COOKIE, tripId, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

export async function clearActiveTripIdCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_TRIP_COOKIE);
}
