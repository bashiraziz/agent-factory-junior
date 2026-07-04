import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveStudentProfile } from "@/lib/student-auth";
import { CORE_CHAPTERS, BONUS_CHAPTERS } from "@/lib/lessons/book-chapters";
import { Mascot } from "@/components/mascot";

export default async function LearnPage() {
  const profile = await resolveStudentProfile();
  if (!profile) redirect("/join");
  if (profile.role !== "student") redirect(`/${profile.role}/dashboard`);

  const rows = await db
    .select({ chapterId: lessonProgress.chapterId })
    .from(lessonProgress)
    .where(eq(lessonProgress.studentId, profile.id));

  const completed = new Set(rows.map((r) => r.chapterId));
  const coreCount = CORE_CHAPTERS.filter((c) => completed.has(c.id)).length;
  const isPathComplete = coreCount === 8;

  return (
    <div className="min-h-screen pb-28" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📖</span>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>
            Meet the <span style={{ color: "#7C5CFF" }}>AI</span>
          </span>
        </div>
        <div
          className="px-3 py-1 rounded-pill font-mono text-xs font-bold"
          style={{ background: "#F4F0FF", color: "#7C5CFF" }}
        >
          {coreCount}/8 CORE DONE
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-10">
        <div className="flex items-center gap-4">
          <Mascot size={64} />
          <div>
            <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
              {isPathComplete ? "You finished the path! 🏆" : "Your Learning Path"}
            </h1>
            <p className="font-sans text-sm mt-1" style={{ color: "#5C5747" }}>
              {isPathComplete
                ? "All 8 core chapters complete. Explore the bonus chapters below!"
                : "Complete each chapter to unlock the next. Earn a badge for every level!"}
            </p>
          </div>
        </div>

        <section>
          <div className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: "#8A8071" }}>
            CORE PATH — 8 CHAPTERS
          </div>
          <div className="space-y-3">
            {CORE_CHAPTERS.map((ch, i) => {
              const done = completed.has(ch.id);
              const locked = !done && i > 0 && !completed.has(CORE_CHAPTERS[i - 1].id);
              return (
                <ChapterCard
                  key={ch.id}
                  id={ch.id}
                  title={ch.title}
                  emoji={ch.emoji}
                  color={ch.color}
                  badgeEmoji={ch.badge.emoji}
                  done={done}
                  locked={locked}
                  order={ch.order}
                  prevTitle={i > 0 ? CORE_CHAPTERS[i - 1].title : undefined}
                />
              );
            })}
          </div>
        </section>

        <section>
          <div className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: "#8A8071" }}>
            EXPLORER TRACK — ALWAYS OPEN
          </div>
          <div className="space-y-3">
            {BONUS_CHAPTERS.map((ch) => {
              const done = completed.has(ch.id);
              return (
                <ChapterCard
                  key={ch.id}
                  id={ch.id}
                  title={ch.title}
                  emoji={ch.emoji}
                  color={ch.color}
                  badgeEmoji={ch.badge.emoji}
                  done={done}
                  locked={false}
                  order={ch.order}
                  isBonus
                />
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function ChapterCard({
  id, title, emoji, color, badgeEmoji, done, locked, order, isBonus, prevTitle,
}: {
  id: string; title: string; emoji: string; color: string;
  badgeEmoji: string; done: boolean; locked: boolean; order: number; isBonus?: boolean; prevTitle?: string;
}) {
  const inner = (
    <div
      className="flex items-center gap-4 p-4 rounded-card"
      style={{
        background: done ? color + "18" : "#FFFFFF",
        border: `2px solid ${done ? color + "55" : "#F0E7D6"}`,
        boxShadow: locked ? "none" : "0 4px 16px rgba(58,46,28,.08)",
        opacity: locked ? 0.6 : 1,
      }}
    >
      <div
        className="w-12 h-12 rounded-block flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: done ? color + "22" : "#F5F3FF" }}
      >
        {done ? badgeEmoji : locked ? "🔒" : emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#8A8071" }}>
          {isBonus ? "EXPLORER" : `LEVEL ${order}`}
        </div>
        <div className="font-sans font-extrabold text-sm leading-snug" style={{ color: "#2A2A3C" }}>
          {title}
        </div>
        {locked && prevTitle && (
          <div className="font-sans text-xs mt-0.5" style={{ color: "#8A8071" }}>
            Finish &quot;{prevTitle}&quot; first
          </div>
        )}
      </div>
      {done ? (
        <span className="text-xl">✅</span>
      ) : locked ? null : (
        <span className="font-sans text-sm font-extrabold" style={{ color: color }}>Start →</span>
      )}
    </div>
  );

  if (locked) return <div>{inner}</div>;
  return (
    <Link href={`/student/learn/${id}`} className="block transition-transform hover:-translate-y-0.5">
      {inner}
    </Link>
  );
}
