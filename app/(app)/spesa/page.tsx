import { redirect } from "next/navigation";
import { requireUser, getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { ShoppingList } from "@/components/shopping/ShoppingList";
import type { ShoppingItem } from "@/lib/types";

export default async function SpesaPage() {
  await requireUser();
  const tripData = await getUserTrip();
  if (!tripData) redirect("/onboarding");

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("trip_id", tripData.trip.id)
    .order("created_at");

  return (
    <AppShell trip={tripData.trip} members={tripData.members}>
      <ShoppingList
        tripId={tripData.trip.id}
        members={tripData.members}
        initialItems={(items ?? []) as ShoppingItem[]}
      />
    </AppShell>
  );
}
