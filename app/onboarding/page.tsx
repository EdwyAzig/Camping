"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tent, Users, Plus } from "lucide-react";
import { CamplyLogo } from "@/components/ui/CamplyLogo";
import { createClient } from "@/lib/supabase/client";
import { createSessionManager } from "@/lib/session-manager";
import { useTranslations } from "@/lib/i18n/client";
import { localizeError } from "@/lib/i18n/errors";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { activateTrip } from "@/lib/activate-trip";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";

export default function OnboardingPage() {
  const { locale, t } = useTranslations();
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [inviteCode, setInviteCode] = useState("");
  const [tripName, setTripName] = useState(() => t("common.defaultTripName"));
  const [locationName, setLocationName] = useState(() => t("defaults.locationName"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const manager = createSessionManager(createClient());
    const result = await manager.createTrip({
      name: tripName,
      locationName,
      locale,
    });

    if (!result.ok) {
      setError(localizeError(t, result.error));
      setLoading(false);
      return;
    }

    await activateTrip(result.tripId);
    router.push("/dashboard");
    router.refresh();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const manager = createSessionManager(createClient());
    const result = await manager.joinByCode(inviteCode, undefined, locale);

    if (!result.ok) {
      setError(localizeError(t, result.error));
      setLoading(false);
      return;
    }

    await activateTrip(result.tripId);
    router.push("/dashboard");
    router.refresh();
  }

  if (mode === "choose") {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center px-safe pt-safe pb-safe p-4">
        <div className="w-full max-w-md space-y-4 animate-fade-up">
          <div className="text-center mb-6">
            <CamplyLogo className="mx-auto h-14 sm:h-16 w-auto mb-4" priority />
            <h1 className="font-[family-name:var(--font-fraunces)] text-2xl sm:text-3xl text-shimmer">
              {t("common.welcome")}
            </h1>
            <p className="text-cream/55 mt-2">{t("auth.onboardingSubtitle")}</p>
          </div>

          <Card
            hover
            gradient
            className="cursor-pointer"
            onClick={() => setMode("create")}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-ember/20">
                <Plus className="w-6 h-6 text-ember" />
              </div>
              <div>
                <CardTitle>{t("auth.createTitle")}</CardTitle>
                <CardDescription>{t("auth.createDescription")}</CardDescription>
              </div>
            </div>
          </Card>

          <Card
            hover
            gradient
            className="cursor-pointer"
            onClick={() => setMode("join")}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-forest-light/50">
                <Users className="w-6 h-6 text-cream" />
              </div>
              <div>
                <CardTitle>{t("auth.joinTitle")}</CardTitle>
                <CardDescription>{t("auth.joinDescription")}</CardDescription>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center px-safe pt-safe pb-safe p-4">
      <div className="w-full max-w-md animate-fade-up">
        <Card glow gradient>
          {mode === "create" ? (
            <>
              <CardTitle>{t("auth.newTripTitle")}</CardTitle>
              <CardDescription className="mb-6">
                {t("auth.newTripDescription")}
              </CardDescription>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label>{t("auth.tripNameLabel")}</Label>
                  <Input
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>{t("auth.locationLabel")}</Label>
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="text-red-300 text-sm">{error}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode("choose")}
                  >
                    {t("common.back")}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? t("common.creation") : t("auth.createSubmit")}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <CardTitle>{t("auth.joinGroupTitle")}</CardTitle>
              <CardDescription className="mb-6">
                {t("auth.joinGroupDescription")}
              </CardDescription>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <Label>{t("auth.sessionCodeLabel")}</Label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder={t("auth.sessionCodePlaceholder")}
                    className="uppercase tracking-widest text-center text-lg"
                    required
                  />
                </div>
                {error && (
                  <p className="text-red-300 text-sm">{error}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode("choose")}
                  >
                    {t("common.back")}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? t("common.joining") : t("auth.joinSubmit")}
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
