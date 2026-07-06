"use client";

import Link from "next/link";
import type { BookChapter } from "@/lib/lessons/book-chapters";

interface Props {
  chapter: BookChapter;
  builderHref: string;
  missionChecked: boolean[];
  onMissionToggle: (i: number) => void;
  quizAnswer: number | null;
  onQuizSelect: (i: number) => void;
  quizSubmitted: boolean;
  onQuizSubmit: () => void;
  alreadyDone: boolean;
}

function CheckRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button onClick={onToggle} className="w-full flex items-center gap-3 text-left">
      <div
        className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-colors"
        style={{
          background: checked ? "#46C46A" : "#FFFFFF",
          borderColor: checked ? "#46C46A" : "#D0C8B8",
        }}
      >
        {checked && <span className="text-white text-xs font-bold">✓</span>}
      </div>
      <span
        className="font-sans text-sm"
        style={{
          color: checked ? "#2E9B52" : "#2A2A3C",
          textDecoration: checked ? "line-through" : "none",
        }}
      >
        {label}
      </span>
    </button>
  );
}

export function MissionPane({
  chapter,
  builderHref,
  missionChecked,
  onMissionToggle,
  quizAnswer,
  onQuizSelect,
  quizSubmitted,
  onQuizSubmit,
  alreadyDone,
}: Props) {
  const allMissionDone = missionChecked.every(Boolean);
  const quizCorrect = quizSubmitted && quizAnswer === chapter.quiz.answer;

  return (
    <div
      style={{
        background: "#FBF6EC",
        borderRadius: 14,
        padding: 24,
      }}
      className="space-y-4"
    >
      {/* Mission card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "2px solid #F0E7D6",
          borderRadius: 12,
          padding: 18,
        }}
        className="space-y-3"
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
            onToggle={() => onMissionToggle(i)}
            label={item}
          />
        ))}
        <Link
          href={builderHref}
          className="inline-block mt-1 font-sans text-sm font-extrabold"
          style={{ color: "#7C5CFF" }}
        >
          Open the builder →
        </Link>
      </div>

      {/* Badge preview */}
      <div className="flex flex-col items-center py-3 gap-1">
        <div className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
          EARN THIS BADGE
        </div>
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            background: chapter.badge.bg,
            border: `2px solid ${chapter.color}44`,
            fontSize: 30,
            filter: allMissionDone ? "none" : "grayscale(1)",
            opacity: allMissionDone ? 1 : 0.55,
            transition: "filter 0.3s, opacity 0.3s",
          }}
        >
          {chapter.badge.emoji}
        </div>
        <div className="font-sans text-xs font-bold mt-1" style={{ color: "#5C5747" }}>
          {chapter.badge.name}
        </div>
      </div>

      {/* Quiz card */}
      <div
        className="space-y-3"
        style={{
          background: "#FFF6E6",
          border: "2px solid #FFC53D44",
          borderRadius: 12,
          padding: 18,
        }}
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
                onClick={() => !quizSubmitted && onQuizSelect(ci)}
                disabled={quizSubmitted || alreadyDone}
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
            onClick={onQuizSubmit}
            disabled={quizAnswer === null || alreadyDone}
            className="w-full py-2.5 rounded-pill font-sans font-extrabold text-sm text-white disabled:opacity-40"
            style={{ background: "#FF924D", boxShadow: "0 3px 0 #CC6B2A" }}
          >
            Check answer
          </button>
        ) : quizCorrect ? (
          <div className="font-sans text-sm font-extrabold text-center" style={{ color: "#2E9B52" }}>✅ Correct! Great job.</div>
        ) : (
          <div className="font-sans text-sm text-center" style={{ color: "#C0443A" }}>Not quite — the correct answer is highlighted above.</div>
        )}
      </div>
    </div>
  );
}
