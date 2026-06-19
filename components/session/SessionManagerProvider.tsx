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
  type SessionSnapshot,
  type TripSessionPreview,
} from "@/lib/session-manager";
import type { Trip, TripMember } from "@/lib/types";
import { useTranslations } from "@/lib/i18n/client";
import { localizeError } from "@/lib/i18n/errors";
import { useRealtimeTable } from "@/lib/hooks/useRealtimeTable";

type SessionManagerContextValue = {
  trip: Trip | null;
  members: TripMember[];
  userId: string;
  currentMember: TripMember | null;
  isInSession: boolean;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  inviteUrl: string | null;
  previewInviteCode: (code: string) => Promise<TripSessionPreview | null>;
  joinByCode: (code: string, displayName?: string) => Promise<boolean>;
  leaveSession: () => Promise<boolean>;
  deleteSession: () => Promise<boolean>;
  deleteTripById: (tripId: string) => Promise<boolean>;
  createTrip: (input: CreateTripInput) => Promise<boolean>;
  createdTrips: CreatedTripSummary[];
  createdTripsLoading: boolean;
  refreshCreatedTrips: () => Promise<void>;
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

  const manager = useMemo(() => createSessionManager(createClient()), []);

  const refreshCreatedTrips = useCallback(async () => {
    setCreatedTripsLoading(true);
    const { trips, error: listError } = await manager.listCreatedTrips();
    setCreatedTrips(trips);
    if (listError) setError(localize(listError));
    setCreatedTripsLoading(false);
  }, [manager]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await manager.load();
    if (next) setSnapshot(next);
    await refreshCreatedTrips();
    setLoading(false);
  }, [manager, refreshCreatedTrips]);

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
    void refreshCreatedTrips();
  }, [refreshCreatedTrips]);

  const currentMember = useMemo(
    () => manager.getCurrentMember(snapshot.members, snapshot.userId) ?? null,
    [manager, snapshot.members, snapshot.userId]
  );

  const inviteUrl = snapshot.trip ? manager.getInviteUrl(snapshot.trip) : null;

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

      await refresh();
      router.refresh();
      setActionLoading(false);
      return true;
    },
    [manager, refresh, router, localize, locale]
  );

  const leaveSession = useCallback(async () => {
    setActionLoading(true);
    setError(null);

    const result = await manager.leave();

    if (!result.ok) {
      setError(localize(result.error));
      setActionLoading(false);
      return false;
    }

    setSnapshot((prev) => ({ ...prev, trip: null, members: [] }));
    await refreshCreatedTrips();
    router.refresh();
    setActionLoading(false);
    return true;
  }, [manager, refreshCreatedTrips, router, localize]);

  const deleteSession = useCallback(async () => {
    setActionLoading(true);
    setError(null);

    const result = await manager.deleteSession();

    if (!result.ok) {
      setError(localize(result.error));
      setActionLoading(false);
      return false;
    }

    setSnapshot((prev) => ({ ...prev, trip: null, members: [] }));
    await refreshCreatedTrips();
    router.refresh();
    setActionLoading(false);
    return true;
  }, [manager, refreshCreatedTrips, router, localize]);

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
        setSnapshot((prev) => ({ ...prev, trip: null, members: [] }));
      }

      await refreshCreatedTrips();
      router.refresh();
      setActionLoading(false);
      return true;
    },
    [manager, refreshCreatedTrips, router, snapshot.trip?.id, localize]
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

      await refresh();
      router.refresh();
      setActionLoading(false);
      return true;
    },
    [manager, refresh, router, localize]
  );

  const value = useMemo<SessionManagerContextValue>(
    () => ({
      trip: snapshot.trip,
      members: snapshot.members,
      userId: snapshot.userId,
      currentMember,
      isInSession: snapshot.trip !== null && currentMember !== null,
      loading,
      actionLoading,
      error,
      inviteUrl,
      previewInviteCode,
      joinByCode,
      leaveSession,
      deleteSession,
      deleteTripById,
      createTrip,
      createdTrips,
      createdTripsLoading,
      refreshCreatedTrips,
      refresh,
      clearError: () => setError(null),
    }),
    [
      snapshot,
      currentMember,
      loading,
      actionLoading,
      error,
      inviteUrl,
      previewInviteCode,
      joinByCode,
      leaveSession,
      deleteSession,
      deleteTripById,
      createTrip,
      createdTrips,
      createdTripsLoading,
      refreshCreatedTrips,
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
