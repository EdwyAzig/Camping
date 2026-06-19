"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Tent } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createSessionManager } from "@/lib/session-manager";
import { useTranslations } from "@/lib/i18n/client";
import { localizeError } from "@/lib/i18n/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { activateTrip } from "@/lib/activate-trip";

export default function JoinPage() {
  const { locale, t } = useTranslations();
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
      const manager = createSessionManager(supabase);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthenticated(!!user);

      const { trip, error: lookupError } = await manager.previewInviteCode(code);

      if (lookupError || !trip) {
        setError(localizeError(t, lookupError ?? "errors.invalidInvite"));
      } else {
        setTripName(trip.name);
      }
      setLoading(false);
    }
    load();
  }, [code, t]);

  async function handleJoin() {
    setJoining(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/register?join=${code}`);
      return;
    }

    const manager = createSessionManager(supabase);
    const result = await manager.joinByCode(code, undefined, locale);

    if (!result.ok) {
      setError(localizeError(t, result.error));
      setJoining(false);
      return;
    }

    await activateTrip(result.tripId);
    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center px-safe pt-safe pb-safe">
        <p className="text-cream/50">{t("common.loadingInvite")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center px-safe pt-safe pb-safe p-4">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <Tent className="w-12 h-12 text-ember mx-auto mb-4" />
          {error ? (
            <>
              <CardTitle>{t("common.oops")}</CardTitle>
              <CardDescription className="mb-4">{error}</CardDescription>
              <Button onClick={() => router.push("/")}>{t("common.goHome")}</Button>
            </>
          ) : (
            <>
              <CardTitle>{t("auth.invitedTitle")}</CardTitle>
              <CardDescription className="mb-6">
                {t("common.joinTripPrefix")}{" "}
                <strong className="text-cream">{tripName}</strong>
              </CardDescription>
              {authenticated ? (
                <Button onClick={handleJoin} disabled={joining} className="w-full">
                  {joining ? t("common.joiningInProgress") : t("auth.joinCamp")}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button onClick={() => router.push(`/register?join=${code}`)} className="w-full">
                    {t("auth.registerAndJoin")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/login?join=${code}`)}
                    className="w-full"
                  >
                    {t("auth.alreadyHaveAccount")}
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
