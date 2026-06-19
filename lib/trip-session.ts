import type { SupabaseClient } from "@supabase/supabase-js";
import { mapSupabaseError } from "@/lib/supabase/errors";

export type TripSessionPreview = {
  id: string;
  name: string;
  location_name: string;
};

export type TripSessionResult =
  | { ok: true; tripId: string }
  | { ok: false; error: string };

export async function getDisplayNameFromUser(
  user: { user_metadata?: { display_name?: string }; email?: string | null } | null
): Promise<string> {
  return (
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Campeggiatore"
  );
}

export async function previewTripByInviteCode(
  supabase: SupabaseClient,
  code: string
): Promise<{ trip: TripSessionPreview | null; error?: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { trip: null, error: "Inserisci un codice" };
  }

  const { data, error } = await supabase.rpc("get_trip_by_invite", {
    code: normalized,
  });

  if (error) {
    return { trip: null, error: mapSupabaseError(error.message, error.code) };
  }

  if (!data?.length) {
    return { trip: null, error: "Codice invito non trovato" };
  }

  return { trip: data[0] as TripSessionPreview };
}

export async function joinTripByCode(
  supabase: SupabaseClient,
  code: string,
  displayName?: string
): Promise<TripSessionResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { ok: false, error: "Inserisci un codice" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Devi essere autenticato" };
  }

  const name = displayName ?? (await getDisplayNameFromUser(user));

  const { data: tripId, error } = await supabase.rpc("join_trip_by_code", {
    code: normalized,
    display_name: name,
  });

  if (error) {
    const message = error.message.includes("Codice invito non trovato")
      ? "Codice invito non trovato"
      : mapSupabaseError(error.message, error.code);
    return { ok: false, error: message };
  }

  return { ok: true, tripId: tripId as string };
}

export async function leaveTripSession(
  supabase: SupabaseClient
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc("leave_trip_session");

  if (error) {
    return { ok: false, error: mapSupabaseError(error.message, error.code) };
  }

  return { ok: true };
}
