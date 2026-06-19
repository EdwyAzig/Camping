import { redirect } from "next/navigation";
import { requireUser, getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsPageContent } from "@/components/settings/SettingsPageContent";
import type { Trip } from "@/lib/types";

export default async function SettingsPage() {
  await requireUser();
  const tripData = await getUserTrip();
  if (!tripData) redirect("/onboarding");

  const trip = tripData.trip as Trip;

  return (
    <AppShell trip={trip} members={tripData.members}>
      <SettingsPageContent tripLat={trip.lat} tripLng={trip.lng} />
    </AppShell>
  );
}
