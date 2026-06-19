import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
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
  user: { user_metadata?: { display_name?: string }; email?: string | null } | null,
  locale: Locale = "it"
): Promise<string> {
  const fallback = createTranslator(getMessages(locale))("common.defaultCamperName");
  return user?.user_metadata?.display_name || user?.email?.split("@")[0] || fallback;
}

export async function previewTripByInviteCode(
  supabase: SupabaseClient,
  code: string
): Promise<{ trip: TripSessionPreview | null; error?: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { trip: null, error: "errors.enterCode" };
  }

  const { data, error } = await supabase.rpc("get_trip_by_invite", {
    code: normalized,
  });

  if (error) {
    return { trip: null, error: mapSupabaseError(error.message, error.code) };
  }

  if (!data?.length) {
    return { trip: null, error: "errors.inviteNotFound" };
  }

  return { trip: data[0] as TripSessionPreview };
}

export async function joinTripByCode(
  supabase: SupabaseClient,
  code: string,
  displayName?: string,
  locale: Locale = "it"
): Promise<TripSessionResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { ok: false, error: "errors.enterCode" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "errors.mustBeAuthenticated" };
  }

  const name = displayName ?? (await getDisplayNameFromUser(user, locale));

  const { data: tripId, error } = await supabase.rpc("join_trip_by_code", {
    code: normalized,
    display_name: name,
  });

  if (error) {
    const message = error.message.includes("Codice invito non trovato")
      ? "errors.inviteNotFound"
      : mapSupabaseError(error.message, error.code);
    return { ok: false, error: message };
  }

  return { ok: true, tripId: tripId as string };
}

export async function leaveTripSession(
  supabase: SupabaseClient,
  tripId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc("leave_trip_by_id", {
    p_trip_id: tripId,
  });

  if (error) {
    return { ok: false, error: mapSupabaseError(error.message, error.code) };
  }

  return { ok: true };
}
