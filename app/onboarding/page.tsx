"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tent, Users, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateInviteCode } from "@/lib/utils";
import { seedTripDefaults } from "@/lib/seed";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { joinTripByCode } from "@/lib/trip-session";
import { mapSupabaseError } from "@/lib/supabase/errors";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { DEFAULT_CAMPING_LOCATION } from "@/lib/default-location";

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [inviteCode, setInviteCode] = useState("");
  const [tripName, setTripName] = useState("Campeggio Parco del Gravio");
  const [locationName, setLocationName] = useState<string>(DEFAULT_CAMPING_LOCATION.name);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function getDisplayName() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return (
      user?.user_metadata?.display_name ||
      user?.email?.split("@")[0] ||
      "Campeggiatore"
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const code = generateInviteCode();
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        name: tripName,
        location_name: locationName,
        lat: DEFAULT_CAMPING_LOCATION.lat,
        lng: DEFAULT_CAMPING_LOCATION.lng,
        departure_date: "Domenica dopo le 18:00",
        return_note: "Lunedì dopo pranzo",
        address: DEFAULT_CAMPING_LOCATION.address,
        invite_code: code,
        created_by: user.id,
      })
      .select()
      .single();

    if (tripError || !trip) {
      setError(
        tripError
          ? mapSupabaseError(tripError.message, tripError.code)
          : "Errore nella creazione"
      );
      setLoading(false);
      return;
    }

    const displayName = await getDisplayName();
    const { error: memberError } = await supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: user.id,
      display_name: displayName,
      role: "owner",
    });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    await seedTripDefaults(trip.id, supabase);
    router.push("/dashboard");
    router.refresh();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const result = await joinTripByCode(
      supabase,
      inviteCode,
      await getDisplayName()
    );

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (mode === "choose") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 animate-fade-up">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-ember/25 to-ember/5 border border-ember/30 mb-5 campfire-icon ember-glow">
              <Tent className="w-9 h-9 text-ember" />
            </div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-shimmer">
              Benvenuto!
            </h1>
            <p className="text-cream/55 mt-2">Crea o unisciti a un campeggio</p>
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
                <CardTitle>Crea campeggio</CardTitle>
                <CardDescription>
                  Imposta luogo e invita gli altri 3 con un codice
                </CardDescription>
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
                <CardTitle>Unisciti</CardTitle>
                <CardDescription>
                  Hai un codice sessione? Entra nel gruppo
                </CardDescription>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">
        <Card glow gradient>
          {mode === "create" ? (
            <>
              <CardTitle>Nuovo campeggio</CardTitle>
              <CardDescription className="mb-6">
                Precompilato con Parco del Gravio, Condove — modifica se serve
              </CardDescription>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label>Nome campeggio</Label>
                  <Input
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Luogo</Label>
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
                    Indietro
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Creazione..." : "Crea e inizia"}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <CardTitle>Unisciti al gruppo</CardTitle>
              <CardDescription className="mb-6">
                Inserisci il codice sessione che ti ha mandato un amico
              </CardDescription>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <Label>Codice sessione</Label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="GRAVIO"
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
                    Indietro
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Unione..." : "Unisciti"}
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
