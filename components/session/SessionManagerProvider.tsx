"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createSessionManager,
  type CreateTripInput,
  type CreatedTripSummary,
  type MembershipSummary,
  type SessionSnapshot,
  type TripSessionPreview,
} from "@/lib/session-manager";
import type { Trip, TripMember } from "@/lib/types";
import { useTranslations } from "@/lib/i18n/client";
import { localizeError } from "@/lib/i18n/errors";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";
import { clearActiveTrip } from "@/app/actions/active-trip";
import { clearActiveTripIdClient } from "@/lib/active-trip-cookie";
import { activateTrip as activateTripClient } from "@/lib/activate-trip";

type SessionManagerContextValue = {
  trip: Trip | null;
  members: TripMember[];
  userId: string;
  memberships: MembershipSummary[];
  currentMember: TripMember | null;
  isInSession: boolean;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  inviteUrl: string | null;
  previewInviteCode: (code: string) => Promise<TripSessionPreview | null>;
  joinByCode: (code: string, displayName?: string) => Promise<boolean>;
  switchTrip: (tripId: string) => Promise<boolean>;
  leaveSession: (tripId?: string) => Promise<boolean>;
  deleteSession: (tripId?: string) => Promise<boolean>;
  deleteTripById: (tripId: string) => Promise<boolean>;
  createTrip: (input: CreateTripInput) => Promise<boolean>;
  createdTrips: CreatedTripSummary[];
  createdTripsLoading: boolean;
  membershipsLoading: boolean;
  refreshCreatedTrips: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const SessionManagerContext = createContext<SessionManagerContextValue | null>(null);

export function SessionManagerProvider({
  initial,
  children,
}: {
  initial: SessionSnapshot;
  children: ReactNode;
}) {
  const router = useRouter();
  const { locale, t } = useTranslations();
  const localize = useCallback((error: string) => localizeError(t, error), [t]);
  const [snapshot, setSnapshot] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTrips, setCreatedTrips] = useState<CreatedTripSummary[]>([]);
  const [createdTripsLoading, setCreatedTripsLoading] = useState(true);
  const [memberships, setMemberships] = useState<MembershipSummary[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(true);

  const manager = useMemo(() => createSessionManager(createClient()), []);

  const refreshMemberships = useCallback(async () => {
    setMembershipsLoading(true);
    const { trips, error: listError } = await manager.listMemberships();
    setMemberships(trips);
    if (listError) setError(localize(listError));
    setMembershipsLoading(false);
  }, [manager, localize]);

  const refreshCreatedTrips = useCallback(async () => {
    setCreatedTripsLoading(true);
    const { trips, error: listError } = await manager.listCreatedTrips(snapshot.trip?.id);
    setCreatedTrips(trips);
    if (listError) setError(localize(listError));
    setCreatedTripsLoading(false);
  }, [manager, snapshot.trip?.id, localize]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await manager.load();
    if (next) setSnapshot(next);
    await Promise.all([refreshCreatedTrips(), refreshMemberships()]);
    setLoading(false);
  }, [manager, refreshCreatedTrips, refreshMemberships]);

  useRealtimeTable(
    "trip_members",
    snapshot.trip?.id ?? null,
    () => {
      void refresh();
    }
  );

  useEffect(() => {
    setSnapshot(initial);
  }, [initial]);

  useEffect(() => {
    void refreshMemberships();
  }, [refreshMemberships]);

  useEffect(() => {
    void refreshCreatedTrips();
  }, [refreshCreatedTrips]);

  const currentMember = useMemo(
    () => manager.getCurrentMember(snapshot.members, snapshot.userId) ?? null,
    [manager, snapshot.members, snapshot.userId]
  );

  const inviteUrl = snapshot.trip ? manager.getInviteUrl(snapshot.trip) : null;

  const activateTrip = useCallback(async (tripId: string) => {
    await activateTripClient(tripId);
  }, []);

  const previewInviteCode = useCallback(
    async (code: string) => {
      setError(null);
      const { trip, error: previewError } = await manager.previewInviteCode(code);
      if (previewError || !trip) {
        setError(localize(previewError ?? "errors.inviteNotFound"));
        return null;
      }
      return trip;
    },
    [manager, localize]
  );

  const switchTrip = useCallback(
    async (tripId: string) => {
      setActionLoading(true);
      setError(null);

      await activateTrip(tripId);
      router.refresh();
      await refreshMemberships();
      setActionLoading(false);
      return true;
    },
    [activateTrip, router, refreshMemberships]
  );

  const joinByCode = useCallback(
    async (code: string, displayName?: string) => {
      setActionLoading(true);
      setError(null);

      const result = await manager.joinByCode(code, displayName, locale);

      if (!result.ok) {
        setError(localize(result.error));
        setActionLoading(false);
        return false;
      }

      await activateTrip(result.tripId);
      await refresh();
      router.refresh();
      setActionLoading(false);
      return true;
    },
    [manager, refresh, router, localize, locale, activateTrip]
  );

  const leaveSession = useCallback(
    async (tripId?: string) => {
      const targetTripId = tripId ?? snapshot.trip?.id;
      if (!targetTripId) return false;

      setActionLoading(true);
      setError(null);

      const result = await manager.leave(targetTripId);

      if (!result.ok) {
        setError(localize(result.error));
        setActionLoading(false);
        return false;
      }

      const remaining = memberships.filter((m) => m.id !== targetTripId);
      if (remaining.length > 0) {
        await activateTrip(remaining[0].id);
      } else {
        await clearActiveTrip();
        clearActiveTripIdClient();
        setSnapshot((prev) => ({ ...prev, trip: null, members: [] }));
      }

      await refresh();
      router.refresh();
      setActionLoading(false);
      return true;
    },
    [manager, snapshot.trip?.id, memberships, refresh, router, localize, activateTrip]
  );

  const deleteSession = useCallback(
    async (tripId?: string) => {
      const targetTripId = tripId ?? snapshot.trip?.id;
      if (!targetTripId) return false;

      setActionLoading(true);
      setError(null);

      const result = await manager.deleteSession(targetTripId);

      if (!result.ok) {
        setError(localize(result.error));
        setActionLoading(false);
        return false;
      }

      const remaining = memberships.filter((m) => m.id !== targetTripId);
      if (remaining.length > 0) {
        await activateTrip(remaining[0].id);
      } else {
        await clearActiveTrip();
        clearActiveTripIdClient();
        setSnapshot((prev) => ({ ...prev, trip: null, members: [] }));
      }

      await refresh();
      router.refresh();
      setActionLoading(false);
      return true;
    },
    [manager, snapshot.trip?.id, memberships, refresh, router, localize, activateTrip]
  );

  const deleteTripById = useCallback(
    async (tripId: string) => {
      setActionLoading(true);
      setError(null);

      const result = await manager.deleteTripById(tripId);

      if (!result.ok) {
        setError(localize(result.error));
        setActionLoading(false);
        return false;
      }

      if (snapshot.trip?.id === tripId) {
        const remaining = memberships.filter((m) => m.id !== tripId);
        if (remaining.length > 0) {
          await activateTrip(remaining[0].id);
        } else {
          await clearActiveTrip();
          clearActiveTripIdClient();
          setSnapshot((prev) => ({ ...prev, trip: null, members: [] }));
        }
      }

      await refresh();
      router.refresh();
      setActionLoading(false);
      return true;
    },
    [manager, refresh, router, snapshot.trip?.id, memberships, localize, activateTrip]
  );

  const createTrip = useCallback(
    async (input: CreateTripInput) => {
      setActionLoading(true);
      setError(null);

      const result = await manager.createTrip(input);

      if (!result.ok) {
        setError(localize(result.error));
        setActionLoading(false);
        return false;
      }

      await activateTrip(result.tripId);
      await refresh();
      router.refresh();
      setActionLoading(false);
      return true;
    },
    [manager, refresh, router, localize, activateTrip]
  );

  const value = useMemo<SessionManagerContextValue>(
    () => ({
      trip: snapshot.trip,
      members: snapshot.members,
      userId: snapshot.userId,
      memberships,
      currentMember,
      isInSession: snapshot.trip !== null && currentMember !== null,
      loading,
      actionLoading,
      error,
      inviteUrl,
      previewInviteCode,
      joinByCode,
      switchTrip,
      leaveSession,
      deleteSession,
      deleteTripById,
      createTrip,
      createdTrips,
      createdTripsLoading,
      membershipsLoading,
      refreshCreatedTrips,
      refreshMemberships,
      refresh,
      clearError: () => setError(null),
    }),
    [
      snapshot,
      memberships,
      currentMember,
      loading,
      actionLoading,
      error,
      inviteUrl,
      previewInviteCode,
      joinByCode,
      switchTrip,
      leaveSession,
      deleteSession,
      deleteTripById,
      createTrip,
      createdTrips,
      createdTripsLoading,
      membershipsLoading,
      refreshCreatedTrips,
      refreshMemberships,
      refresh,
    ]
  );

  return (
    <SessionManagerContext.Provider value={value}>
      {children}
    </SessionManagerContext.Provider>
  );
}

export function useSessionManager(): SessionManagerContextValue {
  const context = useContext(SessionManagerContext);
  if (!context) {
    throw new Error("useSessionManager deve essere usato dentro SessionManagerProvider");
  }
  return context;
}
