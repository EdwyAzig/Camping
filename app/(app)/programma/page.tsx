import { redirect } from "next/navigation";
import { requireUser, getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { SchedulePageContent } from "@/components/schedule/SchedulePageContent";
import type { ActivityWithDetails, ScheduleEntry, Trip } from "@/lib/types";

export default async function ProgrammaPage() {
  const user = await requireUser();
  const tripData = await getUserTrip();
  if (!tripData) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: entries }, { data: activities }] = await Promise.all([
    supabase
      .from("schedule_entries")
      .select("*")
      .eq("trip_id", tripData.trip.id)
      .order("sort_order"),
    supabase
      .from("activities")
      .select("*, activity_participants(user_id), activity_votes(user_id, rating)")
      .eq("trip_id", tripData.trip.id)
      .order("created_at"),
  ]);

  return (
    <AppShell trip={tripData.trip as Trip} members={tripData.members}>
      <SchedulePageContent
        tripId={tripData.trip.id}
        trip={tripData.trip as Trip}
        members={tripData.members}
        userId={user.id}
        initialEntries={(entries ?? []) as ScheduleEntry[]}
        initialActivities={(activities ?? []) as ActivityWithDetails[]}
      />
    </AppShell>
  );
}
