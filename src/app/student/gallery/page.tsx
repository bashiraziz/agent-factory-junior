import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { profiles, classroomMembers, projects } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { resolveStudentProfile } from "@/lib/student-auth";
import { StudentTabBar } from "@/components/student-tab-bar";

export default async function GalleryPage() {
  const profile = await resolveStudentProfile();
  if (!profile) redirect("/sign-in");

  const myClassrooms = await db
    .select({ classroomId: classroomMembers.classroomId })
    .from(classroomMembers)
    .where(eq(classroomMembers.studentId, profile.id));
  const classroomIds = myClassrooms.map((m) => m.classroomId);

  const galleryItems = classroomIds.length
    ? await db
        .select({ project: projects, ownerName: profiles.displayName })
        .from(projects)
        .leftJoin(profiles, eq(projects.ownerId, profiles.id))
        .leftJoin(classroomMembers, eq(projects.ownerId, classroomMembers.studentId))
        .where(
          and(
            eq(projects.shareStatus, "approved"),
            inArray(classroomMembers.classroomId, classroomIds),
          )
        )
        .orderBy(desc(projects.sharedAt))
    : [];

  // Deduplicate — a student in multiple classrooms could join the same project twice
  const seen = new Set<string>();
  const items = galleryItems.filter((i) => {
    if (seen.has(i.project.id)) return false;
    seen.add(i.project.id);
    return true;
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: "#FFFDF7" }}>
      <header className="h-16 flex items-center px-6" style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}>
        <div className="font-display text-xl" style={{ color: "#2A2A3C" }}>🖼 Class Gallery</div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">🖼</div>
            <p className="font-display text-xl" style={{ color: "#2A2A3C" }}>
              No Workers in the gallery yet
            </p>
            <p className="font-sans text-sm" style={{ color: "#8A8071" }}>
              Be the first to share! Publish a Worker and click &ldquo;Share with class →&rdquo;.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map(({ project, ownerName }) => {
              const firstName = (ownerName ?? "Someone").split(" ")[0];
              const isYours = project.ownerId === profile.id;
              return (
                <div
                  key={project.id}
                  className="rounded-card p-5 flex flex-col gap-3"
                  style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-block flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "#F4F0FF" }}>
                      🤖
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-base leading-tight truncate" style={{ color: "#2A2A3C" }}>
                        {project.name}
                      </div>
                      <div className="font-sans text-xs mt-0.5" style={{ color: "#8A8071" }}>
                        By {firstName}{isYours ? " (yours)" : ""}
                      </div>
                    </div>
                  </div>

                  {project.description && (
                    <p className="font-sans text-sm line-clamp-2" style={{ color: "#5C5747" }}>
                      {project.description}
                    </p>
                  )}

                  <Link
                    href={`/student/projects/${project.id}/run`}
                    className="mt-auto py-2.5 rounded-pill font-sans font-extrabold text-sm text-white text-center transition-transform hover:-translate-y-0.5"
                    style={{ background: "#7C5CFF", boxShadow: "0 3px 0 #5B3FCC" }}
                  >
                    Try it →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <StudentTabBar />
    </div>
  );
}
