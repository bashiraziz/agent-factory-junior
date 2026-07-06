interface Props {
  track: "core" | "bonus";
  order: number;
  completedIds: string[];
}

export function ProgressRail({ track, order, completedIds }: Props) {
  if (track === "bonus") {
    return (
      <div
        className="px-3 py-1 rounded-pill font-mono text-xs font-bold"
        style={{ background: "#D6F5F1", color: "#18B5A0" }}
      >
        ★ EXPLORER
      </div>
    );
  }

  const coreTotal = 8;
  const completedCoreCount = completedIds.filter(
    (id) => !["how-to-talk-to-ai", "who-made-this-ai", "ai-and-your-feelings", "when-not-to-use-ai"].includes(id)
  ).length;
  const filledCount = Math.min(completedCoreCount, coreTotal);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: coreTotal }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: 3,
              borderRadius: 2,
              background: i < filledCount ? "#7C5CFF" : "#EDE4D2",
            }}
          />
        ))}
      </div>
      <div
        className="px-2 py-0.5 rounded-pill font-mono text-[9px] font-bold"
        style={{ background: "#FFF9E0", color: "#D69A00" }}
      >
        ★ +4 BONUS
      </div>
    </div>
  );
}
