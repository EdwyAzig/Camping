"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeTable(
  table: string,
  tripId: string | null,
  onChange: () => void,
  options?: { noFilter?: boolean }
) {
  useEffect(() => {
    const supabase = createClient();
    const filter = options?.noFilter
      ? undefined
      : tripId
        ? `trip_id=eq.${tripId}`
        : undefined;

    const channel = supabase
      .channel(`${table}-${tripId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, tripId, onChange, options?.noFilter]);
}
