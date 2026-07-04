export function WeekChart({
  bars,
  maxBar,
}: {
  bars: { label: string; count: number }[];
  maxBar: number;
}) {
  const todayIdx = 6;
  return (
    <div
      className="rounded-card p-5"
      style={{
        background: "#FFFFFF",
        border: "2px solid #F0E7D6",
        boxShadow: "0 4px 12px rgba(58,46,28,.08)",
      }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-widest mb-4"
        style={{ color: "#8A8071" }}
      >
        RUNS THIS WEEK
      </div>
      <div className="flex items-end gap-2 h-24">
        {bars.map((b, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t"
              style={{
                height:
                  b.count === 0
                    ? 4
                    : Math.max(8, Math.round((b.count / maxBar) * 80)),
                background:
                  b.count === 0
                    ? "#F0E7D6"
                    : i === todayIdx
                    ? "#7C5CFF"
                    : "#3DA5F4",
                transition: "height 0.3s",
              }}
            />
            <div
              className="font-mono text-[9px]"
              style={{ color: "#8A8071" }}
            >
              {b.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
