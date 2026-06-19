import { generateFireflies } from "@/lib/ambient-seed";

const FIREFLIES = generateFireflies(20);

export function Fireflies() {
  return (
    <div className="fireflies">
      {FIREFLIES.map((f) => (
        <span
          key={f.id}
          className="firefly"
          style={
            {
              "--left": `${f.left}%`,
              "--top": `${f.top}%`,
              "--size": `${f.size}px`,
              "--delay": `${f.delay}s`,
              "--duration": `${f.duration}s`,
              "--drift": `${f.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
