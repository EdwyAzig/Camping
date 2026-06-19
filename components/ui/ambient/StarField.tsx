import { generateStars } from "@/lib/ambient-seed";

const STARS = generateStars(86);

export function StarField() {
  return (
    <>
      <div className="stars stars-layer-1" />
      <div className="stars stars-layer-2" />
      <div className="stars-dense">
        {STARS.map((star) => (
          <span
            key={star.id}
            className="star-dot"
            style={
              {
                "--left": `${star.left}%`,
                "--top": `${star.top}%`,
                "--size": `${star.size}px`,
                "--delay": `${star.delay}s`,
                "--duration": `${star.duration}s`,
                "--opacity": star.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
