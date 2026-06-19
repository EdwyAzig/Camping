import { redirect } from "next/navigation";
import { requireUser, getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { MealsPageContent } from "@/components/meals/MealsPageContent";
import type { Meal, Trip } from "@/lib/types";

export default async function PastiPage() {
  await requireUser();
  const tripData = await getUserTrip();
  if (!tripData) redirect("/onboarding");

  const supabase = await createClient();
  const { data: meals } = await supabase
    .from("meals")
    .select("*")
    .eq("trip_id", tripData.trip.id)
    .order("created_at");

  return (
    <AppShell trip={tripData.trip as Trip} members={tripData.members}>
      <MealsPageContent
        tripId={tripData.trip.id}
        members={tripData.members}
        initialMeals={(meals ?? []) as Meal[]}
      />
    </AppShell>
  );
}
