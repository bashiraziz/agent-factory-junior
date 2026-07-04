type UsageLimit = {
  dailyRunLimit: number;
  runsUsedToday: number;
} | null | undefined;

export function StudentKpis({
  totalRuns,
  safeRuns,
  flags,
  workerCount,
}: {
  totalRuns: number;
  safeRuns: number;
  flags: number;
  workerCount: number;
}) {
  const tiles = [
    { label: "Total Runs", value: totalRuns, color: "#7C5CFF" },
    { label: "Safe Runs", value: safeRuns, color: "#46C46A" },
    { label: "Flags", value: flags, color: "#E0792B" },
    { label: "Workers", value: workerCount, color: "#3DA5F4" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-card p-5 text-center"
          style={{
            background: "#FFFFFF",
            border: "2px solid #F0E7D6",
            boxShadow: "0 4px 12px rgba(58,46,28,.08)",
          }}
        >
          <div
            className="font-display text-3xl font-semibold"
            style={{ color: tile.color }}
          >
            {tile.value}
          </div>
          <div
            className="font-mono text-[10px] uppercase tracking-widest mt-1"
            style={{ color: "#8A8071" }}
          >
            {tile.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RunLimitBar({ usage }: { usage: UsageLimit }) {
  const runsLeft = usage ? usage.dailyRunLimit - usage.runsUsedToday : null;
  const pct = usage
    ? Math.min(100, (usage.runsUsedToday / usage.dailyRunLimit) * 100)
    : 0;

  return (
    <section>
      <div
        className="font-mono text-xs uppercase tracking-widest mb-3"
        style={{ color: "#8A8071" }}
      >
        DAILY RUN LIMIT
      </div>
      {usage ? (
        <div
          className="rounded-card p-5"
          style={{
            background: "#FFFFFF",
            border: "2px solid #F0E7D6",
            boxShadow: "0 4px 12px rgba(58,46,28,.08)",
          }}
        >
          <div className="flex justify-between mb-2">
            <span className="font-sans text-sm" style={{ color: "#2A2A3C" }}>
              {usage.runsUsedToday} of {usage.dailyRunLimit} used today
            </span>
            <span className="font-sans text-sm" style={{ color: "#5C5747" }}>
              {runsLeft} left
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 10, background: "#F0E7D6" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background:
                  usage.runsUsedToday >= usage.dailyRunLimit
                    ? "#E0792B"
                    : "#7C5CFF",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      ) : (
        <div
          className="rounded-card p-5"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
        >
          <span className="font-sans text-sm" style={{ color: "#8A8071" }}>
            No limit data.
          </span>
        </div>
      )}
    </section>
  );
}
