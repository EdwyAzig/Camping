export function CampfireGlow() {
  return (
    <div className="campfire-scene">
      <div className="campfire-glow campfire-glow-outer" />
      <div className="campfire-glow campfire-glow-inner" />
      <div className="campfire-logs" />
      <div className="campfire-flames">
        <span className="flame flame-1" />
        <span className="flame flame-2" />
        <span className="flame flame-3" />
        <span className="flame flame-4" />
      </div>
      <div className="campfire-sparks">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="campfire-spark" style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
