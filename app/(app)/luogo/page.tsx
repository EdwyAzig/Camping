import { redirect } from "next/navigation";
import { requireUser, getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { LocationPageContent } from "@/components/location/LocationPageContent";
import type { Trip } from "@/lib/types";

export default async function LuogoPage() {
  await requireUser();
  const tripData = await getUserTrip();
  if (!tripData) redirect("/onboarding");

  return (
    <AppShell trip={tripData.trip as Trip} members={tripData.members}>
      <LocationPageContent trip={tripData.trip as Trip} />
    </AppShell>
  );
}
