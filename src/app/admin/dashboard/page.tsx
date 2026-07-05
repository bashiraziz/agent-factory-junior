import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles, classrooms, projects, agentRuns } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";
import { AdminDemoResetButton } from "@/components/admin-demo-reset-button";

export default async function AdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "admin") redirect(`/${profile.role}/dashboard`);

  // Platform counts
  const [userCount] = await db.select({ count: count() }).from(profiles);
  const [classroomCount] = await db.select({ count: count() }).from(classrooms);
  const [projectCount] = await db.select({ count: count() }).from(projects);
  const [runCount] = await db.select({ count: count() }).from(agentRuns);

  const studentCount = await db
    .select({ count: count() })
    .from(profiles)
    .where(eq(profiles.role, "student"))
    .then((r) => r[0].count);
  const teacherCount = await db
    .select({ count: count() })
    .from(profiles)
    .where(eq(profiles.role, "teacher"))
    .then((r) => r[0].count);
  const parentCount = await db
    .select({ count: count() })
    .from(profiles)
    .where(eq(profiles.role, "parent"))
    .then((r) => r[0].count);

  const flaggedCount = await db
    .select({ count: count() })
    .from(agentRuns)
    .where(eq(agentRuns.status, "flagged"))
    .then((r) => r[0].count);

  // Recent users
  const recentUsers = await db.select().from(profiles).limit(10);

  const tiles = [
    { label: "Total Users", value: userCount.count, color: "#7C5CFF", icon: "👥" },
    { label: "Classrooms", value: classroomCount.count, color: "#3DA5F4", icon: "🏫" },
    { label: "Projects", value: projectCount.count, color: "#FFC53D", icon: "🤖" },
    { label: "Total Runs", value: runCount.count, color: "#46C46A", icon: "▶" },
    { label: "Students", value: studentCount, color: "#9B6DFF", icon: "🎓" },
    { label: "Teachers", value: teacherCount, color: "#18B5A0", icon: "👩‍🏫" },
    { label: "Parents", value: parentCount, color: "#FF924D", icon: "👨‍👩‍👧" },
    { label: "Safety Flags", value: flaggedCount, color: "#E0792B", icon: "⚠" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-block flex items-center justify-center"
            style={{ background: "#5B6BE6" }}
          >
            <span className="text-white text-lg">⚙</span>
          </div>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>
            Admin <span style={{ color: "#5B6BE6" }}>Control</span>
          </span>
        </div>
        <AvatarChip name={profile.displayName} size={36} />
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Greeting */}
        <div>
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            PLATFORM OVERVIEW
          </div>
          <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>
            Admin Dashboard
          </h1>
          <p className="font-sans text-lg mt-1" style={{ color: "#5C5747" }}>
            All platform metrics at a glance.
          </p>
        </div>

        {/* KPI tiles 4x2 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded-card p-5"
              style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
            >
              <div className="text-3xl mb-3">{tile.icon}</div>
              <div className="font-display text-4xl font-semibold" style={{ color: tile.color }}>
                {tile.value}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: "#8A8071" }}>
                {tile.label}
              </div>
            </div>
          ))}
        </div>

        {/* Health status */}
        <div
          className="rounded-card p-5 flex items-center gap-4"
          style={{ background: "#D1FAE5", border: "2px solid #46C46A44" }}
        >
          <div className="text-2xl">✅</div>
          <div>
            <div className="font-sans font-extrabold" style={{ color: "#2E9B52" }}>
              Platform Healthy
            </div>
            <div className="font-mono text-xs" style={{ color: "#0E8A78" }}>
              ALL SYSTEMS NOMINAL · MOCK MODEL ACTIVE · DB CONNECTED
            </div>
          </div>
        </div>

        {/* Recent users table */}
        <section>
          <div className="mb-4">
            <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
              RECENT USERS
            </div>
            <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
              {userCount.count} total accounts
            </h2>
          </div>

          <div
            className="rounded-card overflow-hidden"
            style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
          >
            <div
              className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] uppercase tracking-widest"
              style={{ background: "#FBF6EC", borderBottom: "2px solid #F0E7D6", color: "#8A8071" }}
            >
              <div>USER</div>
              <div>ROLE</div>
              <div>JOINED</div>
            </div>

            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3.5 items-center border-b last:border-b-0"
                style={{ borderColor: "#F0E7D6" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarChip name={user.displayName} size={28} />
                  <span className="font-sans text-sm truncate" style={{ color: "#2A2A3C" }}>
                    {user.displayName}
                  </span>
                </div>
                <div>
                  <span
                    className="px-2.5 py-1 rounded-pill font-mono text-[10px] font-bold capitalize"
                    style={{
                      background:
                        user.role === "student" ? "#F4F0FF" :
                        user.role === "teacher" ? "#EFF7FF" :
                        user.role === "parent" ? "#F0FDFB" : "#F0EDFF",
                      color:
                        user.role === "student" ? "#7C5CFF" :
                        user.role === "teacher" ? "#1F6FB0" :
                        user.role === "parent" ? "#0E8A78" : "#5B6BE6",
                    }}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="font-mono text-[10px]" style={{ color: "#8A8071" }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Demo account management */}
        <section className="space-y-3">
          <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "#8A8071" }}>
            DEMO ACCOUNT
          </div>
          <AdminDemoResetButton />
        </section>
      </main>
    </div>
  );
}
