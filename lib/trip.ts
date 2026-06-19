import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

  const { data: membership } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", membership.trip_id)
    .single();

  if (!trip) return null;

  const { data: members } = await supabase
    .from("trip_members")
    .select("*")
    .eq("trip_id", trip.id)
    .order("joined_at");

  return {
    trip: trip as Trip,
    members: (members ?? []) as TripMember[],
    userId: user.id,
  };
}
