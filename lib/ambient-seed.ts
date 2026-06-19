/** Deterministic pseudo-random for stable SSR/client hydration. */
export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type FireflySpec = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
};

export type EmberSpec = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
};

export type StarSpec = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

export type TreeSpec = {
  id: number;
  left: number;
  height: number;
  width: number;
  delay: number;
  seed: number;
  layer: "far" | "mid" | "near";
};

export function generateFireflies(count: number): FireflySpec[] {
  const rand = seededRandom(42);
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: rand() * 100,
    top: 20 + rand() * 55,
    size: 2 + rand() * 3,
    delay: rand() * 12,
    duration: 4 + rand() * 6,
    drift: (rand() - 0.5) * 40,
  }));
}

export function generateEmbers(count: number): EmberSpec[] {
  const rand = seededRandom(77);
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: 5 + rand() * 90,
    delay: rand() * 8,
    duration: 5 + rand() * 5,
    size: 2 + rand() * 4,
    drift: (rand() - 0.5) * 60,
  }));
}

export function generateStars(count: number): StarSpec[] {
  const rand = seededRandom(13);
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: rand() * 100,
    top: rand() * 45,
    size: rand() > 0.85 ? 2.5 : rand() > 0.6 ? 1.5 : 1,
    delay: rand() * 10,
    duration: 2 + rand() * 6,
    opacity: 0.2 + rand() * 0.6,
  }));
}

export function generateTrees(): TreeSpec[] {
  const rand = seededRandom(99);
  const trees: TreeSpec[] = [];
  let id = 0;

  const layers: Array<{ layer: TreeSpec["layer"]; count: number }> = [
    { layer: "far", count: 11 },
    { layer: "mid", count: 13 },
    { layer: "near", count: 12 },
  ];

  for (const { layer, count } of layers) {
    for (let i = 0; i < count; i++) {
      const slot = (i / count) * 100;
      const jitter = (rand() - 0.5) * (100 / count) * 0.55;

      trees.push({
        id: id,
        left: slot + jitter + (100 / count) * 0.5,
        height:
          layer === "far"
            ? 55 + rand() * 45
            : layer === "mid"
              ? 85 + rand() * 55
              : 110 + rand() * 65,
        width:
          layer === "far"
            ? 85 + rand() * 45
            : layer === "mid"
              ? 105 + rand() * 55
              : 125 + rand() * 65,
        delay: rand() * 4,
        seed: id * 7919 + 104729,
        layer,
      });
      id++;
    }
  }

  return trees;
}
