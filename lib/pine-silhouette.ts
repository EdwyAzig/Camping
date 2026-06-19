import { seededRandom } from "@/lib/ambient-seed";

/** Procedural jagged conifer silhouette (reference-style dense pine/fir). */
export function buildPineSilhouette(seed: number, w: number, h: number): string {
  const rand = seededRandom(seed);
  const cx = w / 2;
  const baseY = h;
  const tipLength = h * (0.07 + rand() * 0.04);
  const foliageTop = h * (0.05 + rand() * 0.02);
  const apexY = foliageTop - tipLength;
  const lean = (rand() - 0.5) * w * 0.05;
  const steps = 16 + Math.floor(rand() * 5);

  const left: Array<[number, number]> = [[cx + lean * 0.15, apexY]];
  left.push([cx - w * 0.018 + lean * 0.08, foliageTop - tipLength * 0.35]);
  left.push([cx - w * 0.03 + lean * 0.1, foliageTop]);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const y = foliageTop + t * (baseY - foliageTop);
    const spread = w * (0.05 + t * 0.46) * (0.88 + rand() * 0.24);
    const jag = 2 + Math.floor(rand() * 3);

    for (let j = 0; j < jag; j++) {
      const jt = (j + 1) / (jag + 1);
      const jy = y - (1 - jt) * ((baseY - foliageTop) / steps) * (0.45 + rand() * 0.35);
      const inset = spread * (0.25 + jt * 0.55);
      left.push([
        cx - spread + inset * (0.15 + rand() * 0.25) + (rand() - 0.5) * w * 0.04,
        jy + (rand() - 0.5) * 2,
      ]);
      left.push([
        cx - spread * (0.72 + rand() * 0.18) + lean * t * 0.3,
        jy + ((baseY - foliageTop) / steps) * 0.22,
      ]);
    }

    left.push([cx - spread + lean * t, y]);
  }

  left.push([cx - w * (0.14 + rand() * 0.06) + lean, baseY]);

  const right: Array<[number, number]> = [[cx + w * (0.14 + rand() * 0.06) + lean, baseY]];

  for (let i = steps; i >= 1; i--) {
    const t = i / steps;
    const y = foliageTop + t * (baseY - foliageTop);
    const spread = w * (0.05 + t * 0.46) * (0.88 + rand() * 0.24);
    right.push([cx + spread + lean * t, y]);

    const jag = 2 + Math.floor(rand() * 3);
    for (let j = jag - 1; j >= 0; j--) {
      const jt = (j + 1) / (jag + 1);
      const jy = y - (1 - jt) * ((baseY - foliageTop) / steps) * (0.45 + rand() * 0.35);
      right.push([
        cx + spread * (0.72 + rand() * 0.18) + lean * t * 0.3,
        jy + ((baseY - foliageTop) / steps) * 0.22,
      ]);
      right.push([
        cx + spread - spread * (0.25 + jt * 0.55) * (0.15 + rand() * 0.25) + (rand() - 0.5) * w * 0.04,
        jy + (rand() - 0.5) * 2,
      ]);
    }
  }

  right.push([cx + w * 0.03 + lean * 0.1, foliageTop]);
  right.push([cx + w * 0.018 + lean * 0.08, foliageTop - tipLength * 0.35]);
  right.push([cx + lean * 0.15, apexY]);

  const all = [...left, ...right];
  return `M ${all.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
}
