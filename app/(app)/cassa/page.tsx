import { redirect } from "next/navigation";
import { requireUser, getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { CassaPageContent } from "@/components/cassa/CassaPageContent";
import type { Trip, ShoppingItem, Activity, TripPayment } from "@/lib/types";

export default async function CassaPage() {
  await requireUser();
  const tripData = await getUserTrip();
  if (!tripData) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: shopping }, { data: activities }, { data: payments }] = await Promise.all([
    supabase.from("shopping_items").select("*").eq("trip_id", tripData.trip.id),
    supabase.from("activities").select("*").eq("trip_id", tripData.trip.id),
    supabase.from("trip_payments").select("*").eq("trip_id", tripData.trip.id),
  ]);

  return (
    <AppShell trip={tripData.trip as Trip} members={tripData.members}>
      <CassaPageContent
        trip={tripData.trip as Trip}
        tripId={tripData.trip.id}
        members={tripData.members}
        initialPayments={(payments ?? []) as TripPayment[]}
        initialShopping={(shopping ?? []) as ShoppingItem[]}
        initialActivities={(activities ?? []) as Activity[]}
      />
    </AppShell>
  );
}
