import Link from "next/link";

function relativeTime(lastRun: Date | string | null): string {
  if (!lastRun) return "Never";
  const d = new Date(lastRun);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  if (d >= today)
    return `Today, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  if (d >= yesterday) return "Yesterday";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  return `${days} days ago`;
}

export type StudentRow = {
  student: { id: string; displayName: string };
  runsToday: number;
  totalRuns: number;
  flagCount: number;
  workerCount: number;
  lastRun: Date | string | null;
  activeToday: boolean;
  bars: number[];
  maxBar: number;
  lastRunDaysAgo: number | null;
};

function StatusDot({ row }: { row: StudentRow }) {
  if (row.activeToday) return <span title="Active today">🟢</span>;
  if (row.lastRunDaysAgo === 1) return <span title="Active yesterday">🟡</span>;
  return <span title="Not recently active">⚪</span>;
}

function MiniChart({ bars, maxBar }: { bars: number[]; maxBar: number }) {
  return (
    <div className="flex items-end gap-[2px] h-5">
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: b === 0 ? 3 : Math.max(4, Math.round((b / maxBar) * 20)),
            background: b === 0 ? "#F0E7D6" : "#3DA5F4",
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

const GRID_COLS = "1fr auto auto auto auto auto auto";

function TableHeader() {
  return (
    <div
      className="grid gap-3 px-4 py-3 font-mono text-[9px] uppercase tracking-widest"
      style={{
        gridTemplateColumns: GRID_COLS,
        background: "#FBF6EC",
        borderBottom: "2px solid #F0E7D6",
        color: "#8A8071",
      }}
    >
      <div>STUDENT</div>
      <div>TODAY</div>
      <div>7 DAYS</div>
      <div>WORKERS</div>
      <div>LEVEL</div>
      <div>FLAGS</div>
      <div>LAST ACTIVE</div>
    </div>
  );
}

function StudentRowItem({
  row,
  classroomId,
  lessonProgressMap,
}: {
  row: StudentRow;
  classroomId: string;
  lessonProgressMap: Record<string, number>;
}) {
  const lvl = lessonProgressMap[row.student.id] ?? null;
  return (
    <div
      className="grid gap-3 px-4 py-3 items-center border-b last:border-b-0 min-h-[52px]"
      style={{
        gridTemplateColumns: GRID_COLS,
        borderColor: "#F0E7D6",
        background: row.flagCount > 0 ? "#FFF9EE" : "transparent",
      }}
    >
      <Link
        href={`/teacher/classrooms/${classroomId}/student/${row.student.id}`}
        className="flex items-center gap-2 min-w-0 hover:underline"
        style={{ color: "#2A2A3C" }}
      >
        <StatusDot row={row} />
        <span className="font-sans font-extrabold text-sm truncate">
          {row.student.displayName}
        </span>
      </Link>
      <div className="font-sans text-sm" style={{ color: "#2A2A3C" }}>
        {row.runsToday}
      </div>
      <MiniChart bars={row.bars} maxBar={row.maxBar} />
      <div className="font-sans text-sm" style={{ color: "#2A2A3C" }}>
        {row.workerCount}
      </div>
      <div
        className="font-sans text-sm"
        style={{ color: lvl ? "#7C5CFF" : "#8A8071" }}
      >
        {lvl ? `Lvl ${lvl} 💡` : "—"}
      </div>
      <div>
        {row.flagCount > 0 ? (
          <span
            className="px-2 py-0.5 rounded-pill font-mono text-[10px] font-bold"
            style={{ background: "#FFF1DC", color: "#E0792B" }}
          >
            {row.flagCount} ⚠
          </span>
        ) : (
          <span style={{ color: "#8A8071" }}>—</span>
        )}
      </div>
      <div
        className="font-sans text-xs"
        style={{ color: "#8A8071", whiteSpace: "nowrap" }}
      >
        {relativeTime(row.lastRun)}
      </div>
    </div>
  );
}

export function StudentTable({
  rows,
  classroomId,
  lessonProgressMap,
}: {
  rows: StudentRow[];
  classroomId: string;
  lessonProgressMap: Record<string, number>;
}) {
  if (rows.length === 0) {
    return (
      <div
        className="rounded-card p-8 text-center"
        style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
      >
        <div className="font-sans" style={{ color: "#8A8071" }}>
          No students enrolled yet.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-card overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "2px solid #F0E7D6",
        boxShadow: "0 4px 12px rgba(58,46,28,.08)",
      }}
    >
      <TableHeader />
      {rows.map((row) => (
        <StudentRowItem
          key={row.student.id}
          row={row}
          classroomId={classroomId}
          lessonProgressMap={lessonProgressMap}
        />
      ))}
    </div>
  );
}
