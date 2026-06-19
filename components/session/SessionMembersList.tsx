"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/client";
import type { TripMember } from "@/lib/types";

const memberColors = [
  "from-ember/30 to-ember/10 border-ember/40",
  "from-moss/40 to-forest-light/20 border-moss/40",
  "from-forest-light/40 to-forest/20 border-forest-light/40",
  "from-cream/20 to-cream/5 border-cream/20",
];

export function SessionMembersList({
  members,
  currentUserId,
}: {
  members: TripMember[];
  currentUserId: string;
}) {
  const { t } = useTranslations();

  return (
    <ul className="space-y-2">
      {members.map((member, index) => {
        const isYou = member.user_id === currentUserId;
        return (
          <li
            key={member.user_id}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5",
              isYou
                ? "border-ember/30 bg-ember/10"
                : "border-glass-border bg-night/30"
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full border-2 border-night flex items-center justify-center text-sm font-semibold text-cream bg-gradient-to-br shrink-0",
                memberColors[index % memberColors.length]
              )}
            >
              {member.display_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-cream truncate">
                {member.display_name}
                {isYou && (
                  <span className="ml-1.5 text-xs font-normal text-ember/80">
                    {t("common.you")}
                  </span>
                )}
              </p>
              <p className="text-xs text-cream/40">
                {member.role === "owner"
                  ? t("enums.tripRole.owner")
                  : t("enums.tripRole.member")}
              </p>
            </div>
            {member.role === "owner" && (
              <Crown className="w-4 h-4 text-ember/70 shrink-0" aria-hidden />
            )}
          </li>
        );
      })}
    </ul>
  );
}
