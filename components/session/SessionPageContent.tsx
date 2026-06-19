"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Users, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  joinTripByCode,
  leaveTripSession,
  previewTripByInviteCode,
} from "@/lib/trip-session";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import type { Trip, TripMember } from "@/lib/types";

export function SessionPageContent({
  trip,
  members,
  userId,
}: {
  trip: Trip | null;
  members: TripMember[];
  userId: string;
}) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const currentMember = members.find((m) => m.user_id === userId);
  const joinUrl = trip
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join/${trip.invite_code}`
    : "";

  async function handlePreview() {
    setError("");
    setPreviewName(null);

    const supabase = createClient();
    const { trip: preview, error: previewError } = await previewTripByInviteCode(
      supabase,
      inviteCode
    );

    if (previewError || !preview) {
      setError(previewError ?? "Codice invito non trovato");
      return;
    }

    setPreviewName(preview.name);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const result = await joinTripByCode(supabase, inviteCode);

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleLeave() {
    if (
      !confirm(
        trip
          ? `Vuoi uscire da "${trip.name}"? Potrai rientrare con il codice invito.`
          : "Vuoi uscire dalla sessione?"
      )
    ) {
      return;
    }

    setLeaving(true);
    setError("");

    const supabase = createClient();
    const result = await leaveTripSession(supabase);

    if (!result.ok) {
      setError(result.error);
      setLeaving(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  function copyInvite() {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-cream">
          Sessione
        </h2>
        <p className="text-sm text-cream/50 mt-1">
          Entra o esci da un campeggio con il codice invito
        </p>
      </div>

      {trip && currentMember && (
        <Card glow gradient>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ember" />
            Sessione attiva
          </CardTitle>
          <CardDescription className="mb-4">
            Sei in <strong className="text-cream">{trip.name}</strong> come{" "}
            {currentMember.role === "owner" ? "organizzatore" : "membro"}
          </CardDescription>

          <div className="flex items-center gap-2 mb-4">
            <code className="flex-1 text-center font-mono tracking-widest text-ember bg-night/40 border border-glass-border rounded-lg py-2">
              {trip.invite_code}
            </code>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={copyInvite}
              title="Copia link invito"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-xs text-cream/40 mb-4">
            {members.length} {members.length === 1 ? "persona" : "persone"} nel gruppo
          </p>

          <Button
            type="button"
            variant="danger"
            className="w-full"
            onClick={handleLeave}
            disabled={leaving}
          >
            <LogOut className="w-4 h-4" />
            {leaving ? "Uscita..." : "Esci dalla sessione"}
          </Button>
        </Card>
      )}

      <Card glow gradient>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="w-5 h-5 text-ember" />
          {trip ? "Cambia sessione" : "Entra in una sessione"}
        </CardTitle>
        <CardDescription className="mb-4">
          {trip
            ? "Inserisci il codice di un altro campeggio per passare al nuovo gruppo"
            : "Inserisci il codice che ti ha mandato un amico"}
        </CardDescription>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <Label>Codice sessione</Label>
            <Input
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setPreviewName(null);
              }}
              onBlur={handlePreview}
              placeholder="GRAVIO"
              className="uppercase tracking-widest text-center text-lg"
              required
            />
          </div>

          {previewName && (
            <p className="text-sm text-ember/90 bg-ember/10 border border-ember/20 rounded-lg px-3 py-2 text-center">
              Ti unirai a <strong>{previewName}</strong>
            </p>
          )}

          {error && (
            <p className="text-red-300 text-sm bg-red-900/30 px-3 py-2 rounded-lg border border-red-800/30">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Accesso..." : trip ? "Passa a questa sessione" : "Entra nella sessione"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
