import { redirect } from "next/navigation";
import { requireUser, getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { EquipmentPageContent } from "@/components/equipment/EquipmentPageContent";
import type { Equipment, Trip } from "@/lib/types";

export default async function AttrezzaturaPage() {
  await requireUser();
  const tripData = await getUserTrip();
  if (!tripData) redirect("/onboarding");

  const supabase = await createClient();
  const { data: equipment } = await supabase
    .from("equipment")
    .select("*")
    .eq("trip_id", tripData.trip.id)
    .order("created_at");

  return (
    <AppShell trip={tripData.trip as Trip} members={tripData.members}>
      <EquipmentPageContent
        tripId={tripData.trip.id}
        members={tripData.members}
        initialEquipment={(equipment ?? []) as Equipment[]}
      />
    </AppShell>
  );
}
