"use client";

import { StarField } from "./ambient/StarField";
import { Moon } from "./ambient/Moon";
import { AuroraLayer } from "./ambient/AuroraLayer";
import { Fireflies } from "./ambient/Fireflies";
import { Embers } from "./ambient/Embers";
import { MistLayer } from "./ambient/MistLayer";
import { ForestScene } from "./ambient/ForestScene";
import { CampfireGlow } from "./ambient/CampfireGlow";
import { ShootingStars } from "./ambient/ShootingStars";

export function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden>
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
