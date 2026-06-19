import { generateEmbers } from "@/lib/ambient-seed";

const EMBERS = generateEmbers(15);

export function Embers() {
  return (
    <div className="embers">
      {EMBERS.map((e) => (
        <span
          key={e.id}
          className="ember-particle"
          style={
            {
              "--left": `${e.left}%`,
              "--delay": `${e.delay}s`,
              "--duration": `${e.duration}s`,
              "--size": `${e.size}px`,
              "--drift": `${e.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
