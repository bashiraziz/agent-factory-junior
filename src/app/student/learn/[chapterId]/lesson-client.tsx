"use client";

import { useState } from "react";
import Link from "next/link";
import type { BookChapter } from "@/lib/lessons/book-chapters";
import { Celebration } from "./celebration";

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

  const CALLOUT_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
    remember: { bg: "#FFF4EA", border: "#E0792B55", icon: "💡" },
    try: { bg: "#E8F7ED", border: "#46C46A55", icon: "🌱" },
    safe: { bg: "#EBF5FF", border: "#3DA5F455", icon: "🛡️" },
  };
  const calloutStyle = CALLOUT_STYLES[chapter.callout.kind];

  return (
    <>
      {celebrating && (
        <Celebration
          chapter={chapter}
          completedIds={newlyCompletedIds}
          isPathComplete={pathComplete}
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
          <div className="flex-1" />
          <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
            {chapter.track === "core" ? `LEVEL ${chapter.order}` : "EXPLORER"}
          </div>
        </header>

        <main className="max-w-xl mx-auto px-5 py-7 space-y-6">
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

          {/* Reading section */}
          <div className="space-y-4">
            {chapter.paragraphs.map((p, i) => (
              <p key={i} className="font-sans leading-relaxed" style={{ color: "#2A2A3C", fontSize: "1rem" }}>
                {p}
              </p>
            ))}
            <div
              className="rounded-block p-4 flex gap-3 items-start"
              style={{ background: calloutStyle.bg, border: `2px solid ${calloutStyle.border}` }}
            >
              <span className="text-xl flex-shrink-0">{calloutStyle.icon}</span>
              <p className="font-sans text-sm leading-relaxed" style={{ color: "#2A2A3C" }}>
                {chapter.callout.text}
              </p>
            </div>
          </div>

          {/* Read check */}
          <CheckRow
            checked={readChecked}
            onToggle={() => setReadChecked((v) => !v)}
            label="I read this chapter"
          />

          {/* Mission */}
          <div
            className="rounded-card p-5 space-y-3"
            style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
          >
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
              YOUR MISSION
            </div>
            <div className="font-sans font-extrabold" style={{ color: "#2A2A3C" }}>
              {chapter.mission.title}
            </div>
            <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
              {chapter.mission.description}
            </p>
            {chapter.mission.checklist.map((item, i) => (
              <CheckRow
                key={i}
                checked={missionChecked[i]}
                onToggle={() => setMissionChecked((prev) => prev.map((v, j) => j === i ? !v : v))}
                label={item}
              />
            ))}
            <Link
              href="/student/projects"
              className="inline-block mt-1 font-sans text-sm font-extrabold"
              style={{ color: "#7C5CFF" }}
            >
              Open the builder →
            </Link>
          </div>

          {/* Quiz */}
          <div
            className="rounded-card p-5 space-y-3"
            style={{ background: "#FFF6E6", border: "2px solid #FFC53D44" }}
          >
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
              QUICK QUIZ
            </div>
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>
              {chapter.quiz.q}
            </div>
            <div className="space-y-2">
              {chapter.quiz.choices.map((choice, ci) => {
                const selected = quizAnswer === ci;
                const correct = ci === chapter.quiz.answer;
                let bg = "#FFFFFF", border = "#F0E7D6", color = "#2A2A3C";
                if (quizSubmitted) {
                  if (correct) { bg = "#D1FAE5"; border = "#46C46A"; color = "#2E9B52"; }
                  else if (selected) { bg = "#FEE2E2"; border = "#FF6B6B"; color = "#C0443A"; }
                } else if (selected) {
                  bg = "#F4F0FF"; border = "#7C5CFF"; color = "#7C5CFF";
                }
                return (
                  <button
                    key={ci}
                    onClick={() => !quizSubmitted && setQuizAnswer(ci)}
                    disabled={quizSubmitted}
                    className="w-full text-left px-4 py-2.5 rounded-block font-sans text-sm"
                    style={{ background: bg, border: `2px solid ${border}`, color }}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + ci)}.</span>
                    {choice}
                  </button>
                );
              })}
            </div>
            {!quizSubmitted ? (
              <button
                onClick={() => quizAnswer !== null && setQuizSubmitted(true)}
                disabled={quizAnswer === null}
                className="w-full py-2.5 rounded-pill font-sans font-extrabold text-sm text-white disabled:opacity-40"
                style={{ background: "#FF924D", boxShadow: "0 3px 0 #CC6B2A" }}
              >
                Check answer
              </button>
            ) : quizCorrect ? (
              <div className="font-sans text-sm font-extrabold text-center" style={{ color: "#2E9B52" }}>
                ✅ Correct! Great job.
              </div>
            ) : (
              <div className="font-sans text-sm text-center" style={{ color: "#C0443A" }}>
                Not quite — the correct answer is highlighted above.
              </div>
            )}
          </div>

          {/* Complete button */}
          {!alreadyDone && (
            <button
              onClick={handleComplete}
              disabled={!allDone || completing}
              className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white disabled:opacity-40 transition-transform hover:enabled:-translate-y-0.5"
              style={{
                background: allDone ? chapter.color : "#8A8071",
                boxShadow: allDone ? `0 5px 0 ${chapter.shadowColor}` : "none",
              }}
            >
              {completing ? "Saving…" : allDone ? `Earn your ${chapter.badge.name} badge! 🎉` : "Complete the steps above first"}
            </button>
          )}

          {alreadyDone && (
            <div
              className="rounded-card p-4 text-center"
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

function CheckRow({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center gap-3 text-left">
      <div
        className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-colors"
        style={{ background: checked ? "#46C46A" : "#FFFFFF", borderColor: checked ? "#46C46A" : "#D0C8B8" }}
      >
        {checked && <span className="text-white text-xs font-bold">✓</span>}
      </div>
      <span className="font-sans text-sm" style={{ color: checked ? "#2E9B52" : "#2A2A3C", textDecoration: checked ? "line-through" : "none" }}>
        {label}
      </span>
    </button>
  );
}
