import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveTripIdFromCookie } from "@/lib/active-trip.server";
import type { Trip, TripMember } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

async function loadTripWithMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tripId: string,
  userId: string
): Promise<{ trip: Trip; members: TripMember[]; userId: string } | null> {
  const { data: membership } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (!membership) return null;

  const { data: trip } = await supabase.from("trips").select("*").eq("id", tripId).single();

  if (!trip) return null;

  const { data: members } = await supabase
    .from("trip_members")
    .select("*")
    .eq("trip_id", trip.id)
    .order("joined_at");

  return {
    trip: trip as Trip,
    members: (members ?? []) as TripMember[],
    userId,
  };
}

export async function getUserTrip(): Promise<{
  trip: Trip;
  members: TripMember[];
  userId: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const activeTripId = await getActiveTripIdFromCookie();

  if (activeTripId) {
    const active = await loadTripWithMembers(supabase, activeTripId, user.id);
    if (active) return active;
  }

  const { data: memberships } = await supabase
    .from("trip_members")
    .select("trip_id, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1);

  const fallbackTripId = memberships?.[0]?.trip_id;
  if (!fallbackTripId) return null;

  return loadTripWithMembers(supabase, fallbackTripId, user.id);
}

export async function getUserHasAnyTrip(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from("trip_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (count ?? 0) > 0;
}
