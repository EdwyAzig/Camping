"use client";

import { cn } from "@/lib/utils";
import { StarField } from "./ambient/StarField";
import { Moon } from "./ambient/Moon";
import { AuroraLayer } from "./ambient/AuroraLayer";
import { Fireflies } from "./ambient/Fireflies";
import { Embers } from "./ambient/Embers";
import { MistLayer } from "./ambient/MistLayer";
import { ForestScene } from "./ambient/ForestScene";
import { CampfireGlow } from "./ambient/CampfireGlow";
import { ShootingStars } from "./ambient/ShootingStars";

export function AmbientBackground({
  contained = false,
}: {
  contained?: boolean;
}) {
  return (
    <div
      className={cn("ambient-bg", contained && "ambient-bg-contained")}
      aria-hidden
    >
      <div className="ambient-sky-gradient" />
      <AuroraLayer />
      <StarField />
      <ShootingStars />
      <Moon />
      <MistLayer />
      <Fireflies />
      <ForestScene />
      <CampfireGlow />
      <Embers />
      <div className="ambient-vignette" />
    </div>
  );
}
