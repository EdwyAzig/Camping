import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";
import { getActiveTripIdClient } from "@/lib/active-trip-cookie";
import { getMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
import { DEFAULT_CAMPING_LOCATION } from "@/lib/default-location";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { seedTripDefaults } from "@/lib/seed";
import {
  getDisplayNameFromUser,
  joinTripByCode,
  leaveTripSession,
  previewTripByInviteCode,
  type TripSessionPreview,
  type TripSessionResult,
} from "@/lib/trip-session";
import type { Trip, TripMember } from "@/lib/types";
import { generateInviteCode } from "@/lib/utils";

export type { TripSessionPreview, TripSessionResult };

export type SessionSnapshot = {
  trip: Trip | null;
  members: TripMember[];
  userId: string;
};

export type CreateTripInput = {
  name: string;
  locationName?: string;
  lat?: number;
  lng?: number;
  address?: string;
  departureDate?: string;
  returnNote?: string;
  displayName?: string;
  locale?: Locale;
};

export type SessionActionResult =
  | { ok: true; tripId: string }
  | { ok: false; error: string };

export type CreatedTripSummary = {
  id: string;
  name: string;
  location_name: string;
  invite_code: string;
  created_at: string;
  member_count: number;
  is_active: boolean;
  is_member: boolean;
  can_delete: boolean;
};

export type MembershipSummary = {
  id: string;
  name: string;
  location_name: string;
  invite_code: string;
  role: "owner" | "member";
  joined_at: string;
  member_count: number;
};

export class SessionManager {
  constructor(private readonly supabase: SupabaseClient) {}

  private async resolveActiveTripId(userId: string): Promise<string | null> {
    const cookieTripId = getActiveTripIdClient();
    if (cookieTripId) {
      const { data } = await this.supabase
        .from("trip_members")
        .select("trip_id")
        .eq("user_id", userId)
        .eq("trip_id", cookieTripId)
        .maybeSingle();
      if (data) return cookieTripId;
    }

    const { data: membership } = await this.supabase
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return membership?.trip_id ?? null;
  }

  private async loadTripSnapshot(
    userId: string,
    tripId: string
  ): Promise<SessionSnapshot> {
    const { data: trip } = await this.supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (!trip) {
      return { trip: null, members: [], userId };
    }

    const { data: members } = await this.supabase
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

  async load(): Promise<SessionSnapshot | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) return null;

    const tripId = await this.resolveActiveTripId(user.id);
    if (!tripId) {
      return { trip: null, members: [], userId: user.id };
    }

    return this.loadTripSnapshot(user.id, tripId);
  }

  async listMemberships(): Promise<{
    trips: MembershipSummary[];
    error?: string;
  }> {
    const { data, error } = await this.supabase.rpc("list_my_memberships");

    if (error) {
      return {
        trips: [],
        error: mapSupabaseError(error.message, error.code),
      };
    }

    return { trips: (data ?? []) as MembershipSummary[] };
  }

  async previewInviteCode(
    code: string
  ): Promise<{ trip: TripSessionPreview | null; error?: string }> {
    return previewTripByInviteCode(this.supabase, code);
  }

  async joinByCode(
    code: string,
    displayName?: string,
    locale: Locale = "it"
  ): Promise<TripSessionResult> {
    return joinTripByCode(this.supabase, code, displayName, locale);
  }

  async leave(tripId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    return leaveTripSession(this.supabase, tripId);
  }

  async deleteSession(
    tripId: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const { error } = await this.supabase.rpc("delete_trip_session", {
      p_trip_id: tripId,
    });

    if (error) {
      const message = error.message.includes("organizzatore")
        ? "errors.onlyOrganizerCanDelete"
        : mapSupabaseError(error.message, error.code);
      return { ok: false, error: message };
    }

    return { ok: true };
  }

  async listCreatedTrips(
    activeTripId?: string | null
  ): Promise<{
    trips: CreatedTripSummary[];
    error?: string;
  }> {
    const { data, error } = await this.supabase.rpc("list_my_created_trips", {
      p_active_trip_id: activeTripId ?? null,
    });

    if (error) {
      return {
        trips: [],
        error: mapSupabaseError(error.message, error.code),
      };
    }

    return { trips: (data ?? []) as CreatedTripSummary[] };
  }

  async deleteTripById(
    tripId: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const { error } = await this.supabase.rpc("delete_trip_by_id", {
      p_trip_id: tripId,
    });

    if (error) {
      const message = error.message.includes("organizzatore")
        ? "errors.onlyOrganizerCanDeleteTrip"
        : error.message.includes("non trovata")
          ? "errors.sessionNotFound"
          : mapSupabaseError(error.message, error.code);
      return { ok: false, error: message };
    }

    return { ok: true };
  }

  async createTrip(input: CreateTripInput): Promise<SessionActionResult> {
    const locale = input.locale ?? "it";
    const t = createTranslator(getMessages(locale));
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "errors.mustBeAuthenticated" };
    }

    const displayName =
      input.displayName ?? (await getDisplayNameFromUser(user, locale));

    const { data: trip, error: tripError } = await this.supabase
      .from("trips")
      .insert({
        name: input.name.trim(),
        location_name: input.locationName ?? t("defaults.locationName"),
        lat: input.lat ?? DEFAULT_CAMPING_LOCATION.lat,
        lng: input.lng ?? DEFAULT_CAMPING_LOCATION.lng,
        departure_date: input.departureDate ?? t("defaults.departureNote"),
        return_note: input.returnNote ?? t("defaults.returnNote"),
        address: input.address ?? t("defaults.locationAddress"),
        invite_code: generateInviteCode(),
        created_by: user.id,
      })
      .select()
      .single();

    if (tripError || !trip) {
      return {
        ok: false,
        error: tripError
          ? mapSupabaseError(tripError.message, tripError.code)
          : "errors.createTripFailed",
      };
    }

    const { error: memberError } = await this.supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: user.id,
      display_name: displayName,
      role: "owner",
    });

    if (memberError) {
      return {
        ok: false,
        error: mapSupabaseError(memberError.message, memberError.code),
      };
    }

    await seedTripDefaults(trip.id, this.supabase, locale);

    return { ok: true, tripId: trip.id };
  }

  getInviteUrl(trip: Trip, origin = ""): string {
    const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}/join/${trip.invite_code}`;
  }

  getCurrentMember(members: TripMember[], userId: string): TripMember | undefined {
    return members.find((member) => member.user_id === userId);
  }
}

export function createSessionManager(supabase: SupabaseClient): SessionManager {
  return new SessionManager(supabase);
}
