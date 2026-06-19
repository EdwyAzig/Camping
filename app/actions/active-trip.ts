"use server";

import { setActiveTripIdCookie, clearActiveTripIdCookie } from "@/lib/active-trip.server";

export async function setActiveTrip(tripId: string): Promise<void> {
  await setActiveTripIdCookie(tripId);
}

export async function clearActiveTrip(): Promise<void> {
  await clearActiveTripIdCookie();
}
