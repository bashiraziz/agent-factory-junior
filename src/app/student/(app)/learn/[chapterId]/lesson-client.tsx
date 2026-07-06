"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { BookChapter } from "@/lib/lessons/book-chapters";
import { Celebration } from "./celebration";
import { ProgressRail } from "./progress-rail";
import { ReaderPane } from "./reader-pane";
import { MissionPane } from "./mission-pane";

interface Props { chapter: BookChapter; completedIds: string[]; alreadyDone: boolean; }

export function LessonClient({ chapter, completedIds, alreadyDone }: Props) {
  const [readChecked, setReadChecked] = useState(alreadyDone);
  const [missionChecked, setMissionChecked] = useState<boolean[]>(
    chapter.mission.checklist.map(() => alreadyDone)
  );
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(alreadyDone);
  const [celebrating, setCelebrating] = useState(false);
  const [newlyCompletedIds, setNewlyCompletedIds] = useState<string[]>(completedIds);
  const [pathComplete, setPathComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [pathProjectId, setPathProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lessons/path-project")
      .then((r) => r.json())
      .then((d) => d.projectId && setPathProjectId(d.projectId))
      .catch(() => {});
  }, []);

  const builderHref = pathProjectId
    ? `/student/projects/${pathProjectId}/edit?lesson=${chapter.id}`
    : "/student/projects";

  const allMissionDone = missionChecked.every(Boolean);
  const quizCorrect = quizSubmitted && quizAnswer === chapter.quiz.answer;
  const allDone = readChecked && allMissionDone && quizCorrect;

  const handleComplete = async () => {
    if (completing || alreadyDone) return;
    setCompleting(true);
    try {
      const res = await fetch("/api/lessons/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewlyCompletedIds(data.completedChapterIds ?? []);
        setPathComplete(data.isPathComplete ?? false);
        setCelebrating(true);
      }
    } finally {
      setCompleting(false);
    }
  };

  const lgGridCols = { gridTemplateColumns: "1.55fr 1fr", gap: 32, alignItems: "start" };

  return (
    <>
      {celebrating && (
        <Celebration
          chapter={chapter}
          completedIds={newlyCompletedIds}
          isPathComplete={pathComplete}
          pathProjectId={pathProjectId}
          onClose={() => setCelebrating(false)}
        />
      )}

      <div className="min-h-screen pb-28" style={{ background: "#FFFDF7" }}>
        <header
          className="h-14 flex items-center gap-3 px-5"
          style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
        >
          <Link href="/student/learn" className="font-sans text-sm font-extrabold" style={{ color: "#7C5CFF" }}>
            ← Back
          </Link>
          <div className="flex-1 flex justify-center">
            <ProgressRail
              track={chapter.track}
              order={chapter.order}
              completedIds={completedIds}
            />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
            {chapter.track === "core" ? `LEVEL ${chapter.order}` : "EXPLORER"}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-7">
          {/* Chapter hero */}
          <div
            className="rounded-card p-6 text-center"
            style={{ background: chapter.color + "18", border: `2px solid ${chapter.color}33` }}
          >
            <div className="text-5xl mb-2">{chapter.emoji}</div>
            <h1 className="font-display text-2xl font-semibold" style={{ color: "#2A2A3C" }}>
              {chapter.title}
            </h1>
          </div>

          {/* Two-column layout on lg+ */}
          <div
            className="mt-6 flex flex-col lg:grid gap-8"
            style={{ ...lgGridCols } as React.CSSProperties}
          >
            <ReaderPane
              chapter={chapter}
              readChecked={readChecked}
              onReadToggle={() => setReadChecked((v) => !v)}
            />
            <MissionPane
              chapter={chapter}
              builderHref={builderHref}
              missionChecked={missionChecked}
              onMissionToggle={(i) => setMissionChecked((prev) => prev.map((v, j) => j === i ? !v : v))}
              quizAnswer={quizAnswer}
              onQuizSelect={setQuizAnswer}
              quizSubmitted={quizSubmitted}
              onQuizSubmit={() => quizAnswer !== null && setQuizSubmitted(true)}
              alreadyDone={alreadyDone}
            />
          </div>

          {/* Earn badge button */}
          {!alreadyDone && (
            <button
              onClick={handleComplete}
              disabled={!allDone || completing}
              className="w-full mt-8 py-4 rounded-pill font-sans font-extrabold text-lg text-white disabled:opacity-40 transition-transform hover:enabled:-translate-y-0.5"
              style={{
                background: allDone ? chapter.color : "#8A8071",
                boxShadow: allDone ? `0 5px 0 ${chapter.shadowColor}` : "none",
              }}
            >
              {completing ? "Saving…" : allDone ? `Earn your ${chapter.badge.name} badge! 🎉` : "Complete the steps above first"}
            </button>
          )}

          {/* Already done card */}
          {alreadyDone && (
            <div
              className="mt-8 rounded-card p-4 text-center"
              style={{ background: chapter.color + "18", border: `2px solid ${chapter.color}55` }}
            >
              <div className="text-2xl mb-1">{chapter.badge.emoji}</div>
              <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>
                You earned the {chapter.badge.name} badge!
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
