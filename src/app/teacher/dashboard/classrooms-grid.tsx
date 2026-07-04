import Link from "next/link";

type Classroom = {
  id: string;
  name: string;
  joinCode: string;
  createdAt: Date;
};

type MemberCount = { classroom: Classroom; count: number };

type RunStat = { classroomId: string; todayCount: number; flagCount: number };

export function ClassroomsGrid({
  classrooms,
  memberCounts,
  runStats,
}: {
  classrooms: Classroom[];
  memberCounts: MemberCount[];
  runStats: RunStat[];
}) {
  if (classrooms.length === 0) {
    return (
      <div
        className="rounded-card p-10 text-center"
        style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
      >
        <div className="text-5xl mb-4">🏫</div>
        <div
          className="font-display text-xl mb-2"
          style={{ color: "#2A2A3C" }}
        >
          Create your first classroom
        </div>
        <p className="font-sans mb-5" style={{ color: "#5C5747" }}>
          Students join with a code. You can review their AI Workers and runs.
        </p>
        <Link
          href="/teacher/classrooms/new"
          className="inline-block px-6 py-3 rounded-pill font-sans font-extrabold text-white"
          style={{ background: "#3DA5F4", boxShadow: "0 4px 0 #1F6FB0" }}
        >
          Create Classroom →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {classrooms.map((classroom) => {
        const mc = memberCounts.find((m) => m.classroom.id === classroom.id);
        const stats = runStats.find((s) => s.classroomId === classroom.id);
        return (
          <Link
            key={classroom.id}
            href={`/teacher/classrooms/${classroom.id}`}
            className="rounded-card p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1"
            style={{
              background: "#FFFFFF",
              border: "2px solid #F0E7D6",
              boxShadow: "0 18px 50px rgba(58,46,28,.12)",
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-block flex items-center justify-center text-xl"
                style={{ background: "#EFF7FF" }}
              >
                🏫
              </div>
              <div
                className="px-2.5 py-1 rounded-pill font-mono text-[10px] font-bold"
                style={{ background: "#F4F0FF", color: "#7C5CFF" }}
              >
                {classroom.joinCode}
              </div>
            </div>
            <div>
              <div
                className="font-display text-lg font-semibold"
                style={{ color: "#2A2A3C" }}
              >
                {classroom.name}
              </div>
              <div
                className="font-sans text-sm mt-1"
                style={{ color: "#5C5747" }}
              >
                {mc?.count ?? 0} student{mc?.count !== 1 ? "s" : ""}
              </div>
              <div className="font-sans text-xs" style={{ color: "#5C5747" }}>
                {stats?.todayCount ?? 0} runs today
                {(stats?.flagCount ?? 0) > 0 && (
                  <span style={{ color: "#E0792B" }}>
                    {" "}· {stats!.flagCount} flag{stats!.flagCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <div
              className="font-mono text-[10px] uppercase tracking-widest"
              style={{ color: "#8A8071" }}
            >
              Created{" "}
              {new Date(classroom.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
