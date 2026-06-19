import { setActiveTrip } from "@/app/actions/active-trip";
import { setActiveTripIdClient } from "@/lib/active-trip-cookie";

export async function activateTrip(tripId: string): Promise<void> {
  await setActiveTrip(tripId);
  setActiveTripIdClient(tripId);
}
