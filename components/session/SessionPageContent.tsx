"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Users, Copy, Check, Trash2 } from "lucide-react";
import { useSessionManager } from "@/components/session/SessionManagerProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { SessionMembersList } from "@/components/session/SessionMembersList";
import { SessionCreatedTripsList } from "@/components/session/SessionCreatedTripsList";
import { useTranslations } from "@/lib/i18n/client";
import type { CreatedTripSummary } from "@/lib/session-manager";

export function SessionPageContent() {
  const router = useRouter();
  const { t } = useTranslations();
  const {
    trip,
    members,
    userId,
    currentMember,
    actionLoading,
    error,
    inviteUrl,
    previewInviteCode,
    joinByCode,
    leaveSession,
    deleteSession,
    deleteTripById,
    createdTrips,
    createdTripsLoading,
    clearError,
  } = useSessionManager();

  const [inviteCode, setInviteCode] = useState("");
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handlePreview() {
    clearError();
    setPreviewName(null);
    const preview = await previewInviteCode(inviteCode);
    if (preview) setPreviewName(preview.name);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const ok = await joinByCode(inviteCode);
    if (ok) router.push("/dashboard");
  }

  async function handleLeave() {
    if (
      !confirm(
        trip
          ? t("session.confirmLeaveWithTrip", { name: trip.name })
          : t("session.confirmLeave")
      )
    ) {
      return;
    }

    const ok = await leaveSession();
    if (ok) router.push("/onboarding");
  }

  async function handleDelete() {
    if (!trip) return;

    const confirmed = confirm(t("session.confirmDeleteSession", { name: trip.name }));
    if (!confirmed) return;

    const typed = prompt(t("session.confirmTypeNameToConfirm", { name: trip.name }));
    if (typed?.trim() !== trip.name) {
      if (typed !== null) alert(t("session.confirmNameMismatch"));
      return;
    }

    const ok = await deleteSession();
    if (ok) router.push("/onboarding");
  }

  async function handleJoinFromHistory(inviteCode: string) {
    if (
      trip &&
      !confirm(t("session.confirmSwitchSession", { name: trip.name }))
    ) {
      return;
    }

    const ok = await joinByCode(inviteCode);
    if (ok) router.push("/dashboard");
  }

  async function handleDeleteFromHistory(entry: CreatedTripSummary) {
    const confirmed = confirm(
      entry.member_count === 0
        ? t("session.confirmDeleteEmpty", { name: entry.name })
        : t("session.confirmDeleteWithMembers", { name: entry.name })
    );
    if (!confirmed) return;

    if (entry.member_count > 0) {
      const typed = prompt(t("session.confirmTypeNameToConfirm", { name: entry.name }));
      if (typed?.trim() !== entry.name) {
        if (typed !== null) alert(t("session.confirmNameMismatch"));
        return;
      }
    }

    const ok = entry.is_active
      ? await deleteSession()
      : await deleteTripById(entry.id);

    if (ok && entry.is_active) router.push("/onboarding");
  }

  function copyInvite() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <p className="text-xs uppercase tracking-widest text-ember/70 font-medium mb-1">
          {t("session.managerTitle")}
        </p>
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-cream">
          {t("session.yourSession")}
        </h2>
        <p className="text-sm text-cream/50 mt-1">{t("session.description")}</p>
      </div>

      {trip && currentMember && (
        <Card glow gradient>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ember" />
            {t("session.activeSession")}
          </CardTitle>
          <CardDescription className="mb-4">
            {t("common.activeSessionPrefix")}{" "}
            <strong className="text-cream">{trip.name}</strong>{" "}
            {t("common.activeSessionSuffix", {
              role:
                currentMember.role === "owner"
                  ? t("session.roleOrganizer")
                  : t("session.roleMember"),
            })}
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
              title={t("nav.copyInviteLink")}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-xs text-cream/50 mb-2 font-medium">
              {members.length === 1
                ? t("session.personInGroup", { count: members.length })
                : t("session.peopleInGroup", { count: members.length })}
            </p>
            <SessionMembersList members={members} currentUserId={userId} />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleLeave}
            disabled={actionLoading}
          >
            <LogOut className="w-4 h-4" />
            {actionLoading ? t("common.leaving") : t("session.leaveSession")}
          </Button>

          {currentMember.role === "owner" && (
            <Button
              type="button"
              variant="danger"
              className="w-full mt-2"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              <Trash2 className="w-4 h-4" />
              {actionLoading ? t("common.deleting") : t("session.deleteSession")}
            </Button>
          )}
        </Card>
      )}

      <Card glow gradient>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="w-5 h-5 text-ember" />
          {trip ? t("session.switchSession") : t("session.joinSession")}
        </CardTitle>
        <CardDescription className="mb-4">
          {trip ? t("session.switchDescription") : t("session.joinDescription")}
        </CardDescription>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <Label>{t("session.sessionCode")}</Label>
            <Input
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setPreviewName(null);
                clearError();
              }}
              onBlur={handlePreview}
              placeholder={t("auth.sessionCodePlaceholder")}
              className="uppercase tracking-widest text-center text-lg"
              required
            />
          </div>

          {previewName && (
            <p className="text-sm text-ember/90 bg-ember/10 border border-ember/20 rounded-lg px-3 py-2 text-center">
              {t("common.previewJoinPrefix")} <strong>{previewName}</strong>
            </p>
          )}

          {error && (
            <p className="text-red-300 text-sm bg-red-900/30 px-3 py-2 rounded-lg border border-red-800/30">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={actionLoading}>
            {actionLoading
              ? t("common.loggingIn")
              : trip
                ? t("session.switchToSession")
                : t("session.enterSession")}
          </Button>
        </form>
      </Card>

      <SessionCreatedTripsList
        trips={createdTrips}
        loading={createdTripsLoading}
        actionLoading={actionLoading}
        onJoin={handleJoinFromHistory}
        onDelete={handleDeleteFromHistory}
      />
    </div>
  );
}
