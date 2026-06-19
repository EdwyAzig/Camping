import { generateTrees } from "@/lib/ambient-seed";
import { buildPineSilhouette } from "@/lib/pine-silhouette";

const TREES = generateTrees();

function JaggedPine({ seed }: { seed: number }) {
  const path = buildPineSilhouette(seed, 100, 100);
  return (
    <svg
      viewBox="0 -8 100 108"
      preserveAspectRatio="none"
      className="h-full w-full block overflow-visible"
      aria-hidden
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}

export function ForestScene() {
  return (
    <div className="forest-scene">
      <div className="forest-layer forest-far">
        {TREES.filter((t) => t.layer === "far").map((tree) => (
          <div
            key={tree.id}
            className="forest-tree tree-sway-slow"
            style={
              {
                "--left": `${tree.left}%`,
                "--height": `${tree.height}px`,
                "--width": `${tree.width}px`,
                "--delay": `${tree.delay}s`,
                "--z": 1,
              } as React.CSSProperties
            }
          >
            <JaggedPine seed={tree.seed} />
          </div>
        ))}
      </div>
      <div className="forest-layer forest-mid">
        {TREES.filter((t) => t.layer === "mid").map((tree) => (
          <div
            key={tree.id}
            className="forest-tree tree-sway"
            style={
              {
                "--left": `${tree.left}%`,
                "--height": `${tree.height}px`,
                "--width": `${tree.width}px`,
                "--delay": `${tree.delay}s`,
                "--z": 2,
              } as React.CSSProperties
            }
          >
            <JaggedPine seed={tree.seed} />
          </div>
        ))}
      </div>
      <div className="forest-layer forest-near">
        {TREES.filter((t) => t.layer === "near").map((tree) => (
          <div
            key={tree.id}
            className="forest-tree tree-sway-fast"
            style={
              {
                "--left": `${tree.left}%`,
                "--height": `${tree.height}px`,
                "--width": `${tree.width}px`,
                "--delay": `${tree.delay}s`,
                "--z": 3,
              } as React.CSSProperties
            }
          >
            <JaggedPine seed={tree.seed} />
          </div>
        ))}
      </div>
      <div className="forest-base" />
    </div>
  );
}
