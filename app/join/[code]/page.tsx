"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Tent } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { joinTripByCode, previewTripByInviteCode } from "@/lib/trip-session";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";

export default function JoinPage() {
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setAuthenticated(!!user);

      const { trip, error: lookupError } = await previewTripByInviteCode(
        supabase,
        code
      );

      if (lookupError || !trip) {
        setError(lookupError ?? "Invito non valido o scaduto");
      } else {
        setTripName(trip.name);
      }
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/register?join=${code}`);
      return;
    }

    const result = await joinTripByCode(supabase, code);

    if (!result.ok) {
      setError(result.error);
      setJoining(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cream/50">Caricamento invito...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <Tent className="w-12 h-12 text-ember mx-auto mb-4" />
          {error ? (
            <>
              <CardTitle>Ops!</CardTitle>
              <CardDescription className="mb-4">{error}</CardDescription>
              <Button onClick={() => router.push("/")}>Torna alla home</Button>
            </>
          ) : (
            <>
              <CardTitle>Sei invitato!</CardTitle>
              <CardDescription className="mb-6">
                Unisciti a <strong className="text-cream">{tripName}</strong>
              </CardDescription>
              {authenticated ? (
                <Button onClick={handleJoin} disabled={joining} className="w-full">
                  {joining ? "Unione in corso..." : "Unisciti al campeggio"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button onClick={() => router.push(`/register?join=${code}`)} className="w-full">
                    Registrati e unisciti
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/login?join=${code}`)}
                    className="w-full"
                  >
                    Ho già un account
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
