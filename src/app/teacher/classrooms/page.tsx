import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles, classrooms, classroomMembers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";

export default async function TeacherClassrooms() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "teacher") redirect(`/${profile.role}/dashboard`);

  const myClassrooms = await db
    .select()
    .from(classrooms)
    .where(eq(classrooms.teacherId, profile.id))
    .orderBy(desc(classrooms.createdAt));

  const enriched = await Promise.all(
    myClassrooms.map(async (c) => {
      const members = await db
        .select()
        .from(classroomMembers)
        .where(eq(classroomMembers.classroomId, c.id));
      return { classroom: c, studentCount: members.length };
    })
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/teacher/dashboard" style={{ color: "#3DA5F4" }} className="p-2 rounded-block">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>My Classrooms</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/classrooms/new"
            className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white"
            style={{ background: "#3DA5F4", boxShadow: "0 4px 0 #1F6FB0" }}
          >
            + New Classroom
          </Link>
          <AvatarChip name={profile.displayName} size={36} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            MY CLASSROOMS
          </div>
          <h1 className="font-display text-3xl" style={{ color: "#2A2A3C" }}>
            {enriched.length} classroom{enriched.length !== 1 ? "s" : ""}
          </h1>
        </div>

        {enriched.length === 0 ? (
          <div
            className="rounded-card p-12 text-center"
            style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
          >
            <div className="text-6xl mb-4">🏫</div>
            <div className="font-display text-2xl mb-2" style={{ color: "#2A2A3C" }}>
              No classrooms yet
            </div>
            <p className="font-sans mb-6" style={{ color: "#5C5747" }}>
              Create a classroom and share the join code with your students.
            </p>
            <Link
              href="/teacher/classrooms/new"
              className="inline-block px-6 py-3 rounded-pill font-sans font-extrabold text-white"
              style={{ background: "#3DA5F4", boxShadow: "0 4px 0 #1F6FB0" }}
            >
              Create Your First Classroom →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enriched.map(({ classroom, studentCount }) => (
              <Link
                key={classroom.id}
                href={`/teacher/classrooms/${classroom.id}`}
                className="flex items-center gap-4 rounded-card p-5 transition-transform hover:-translate-y-0.5"
                style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
              >
                <div
                  className="w-12 h-12 rounded-block flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "#EFF7FF" }}
                >
                  🏫
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg font-semibold truncate" style={{ color: "#2A2A3C" }}>
                    {classroom.name}
                  </div>
                  <div className="font-sans text-sm" style={{ color: "#5C5747" }}>
                    {studentCount} student{studentCount !== 1 ? "s" : ""} · Created {new Date(classroom.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div
                  className="px-3 py-1.5 rounded-pill font-mono text-sm font-bold flex-shrink-0"
                  style={{ background: "#F4F0FF", color: "#7C5CFF" }}
                >
                  {classroom.joinCode}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8071" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
