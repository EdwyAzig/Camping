import { redirect } from "next/navigation";
import { requireUser, getUserTrip } from "@/lib/trip";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { ControlCenterDashboard } from "@/components/dashboard/ControlCenterDashboard";
import { fetchWeather } from "@/lib/weather";
import {
  calcFinance,
  calcShoppingProgress,
  calcEquipmentProgress,
  getUrgentItems,
} from "@/lib/finance";
import { getNextTimelineEntry } from "@/lib/dates";
import { getLocale } from "@/lib/i18n/server";
import type {
  Trip,
  ShoppingItem,
  Equipment,
  Activity,
  TripPayment,
  ScheduleEntry,
} from "@/lib/types";

export default async function DashboardPage() {
  await requireUser();
  const tripData = await getUserTrip();
  if (!tripData) redirect("/onboarding");

  const { trip, members } = tripData;
  const locale = await getLocale();
  const supabase = await createClient();

  const [
    { data: shopping },
    { data: equipment },
    { data: activities },
    { data: payments },
    { data: timeline },
    weather,
  ] = await Promise.all([
    supabase.from("shopping_items").select("*").eq("trip_id", trip.id),
    supabase.from("equipment").select("*").eq("trip_id", trip.id),
    supabase.from("activities").select("*").eq("trip_id", trip.id),
    supabase.from("trip_payments").select("*").eq("trip_id", trip.id),
    supabase
      .from("schedule_entries")
      .select("*")
      .eq("trip_id", trip.id)
      .eq("entry_type", "timeline")
      .order("sort_order"),
    fetchWeather(trip.lat, trip.lng, locale),
  ]);

  const tripFull = trip as Trip;
  const finance = calcFinance(
    tripFull,
    members,
    (shopping ?? []) as ShoppingItem[],
    (activities ?? []) as Activity[],
    (payments ?? []) as TripPayment[]
  );

  return (
    <AppShell trip={tripFull} members={members}>
      <ControlCenterDashboard
        trip={tripFull}
        members={members}
        weather={weather}
        finance={finance}
        shoppingProgress={calcShoppingProgress((shopping ?? []) as ShoppingItem[])}
        equipmentProgress={calcEquipmentProgress((equipment ?? []) as Equipment[])}
        urgentItems={getUrgentItems(
          (equipment ?? []) as Equipment[],
          (shopping ?? []) as ShoppingItem[],
          locale
        )}
        nextTimeline={getNextTimelineEntry((timeline ?? []) as ScheduleEntry[])}
      />
    </AppShell>
  );
}
