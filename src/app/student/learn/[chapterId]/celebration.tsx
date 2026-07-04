"use client";

import Link from "next/link";
import type { BookChapter } from "@/lib/lessons/book-chapters";
import { CORE_CHAPTERS } from "@/lib/lessons/book-chapters";

interface Props {
  chapter: BookChapter;
  completedIds: string[];
  isPathComplete: boolean;
  onClose: () => void;
}

const CONFETTI = ["🎉", "⭐", "🎊", "✨", "🌟", "🎈", "💫", "🏅", "🎁", "🦋"];

export function Celebration({ chapter, completedIds, isPathComplete, onClose }: Props) {
  const isBonus = chapter.track === "bonus";
  const ringColor = isPathComplete
    ? "#FFC53D"
    : isBonus
    ? "#18B5A0"
    : chapter.color;

  const ringAnim = isPathComplete
    ? "afjRingGlowGold"
    : isBonus
    ? "afjRingGlowTeal"
    : "afjRingGlowBlue";

  const nextCore = CORE_CHAPTERS.find((c) => !completedIds.includes(c.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(42,42,60,0.85)" }}
      onClick={onClose}
    >
      {/* Confetti */}
      {CONFETTI.map((emoji, i) => (
        <span
          key={i}
          className="afj-confetti"
          style={{ left: `${5 + i * 9}%`, animationDelay: `${i * 0.2}s` }}
        >
          {emoji}
        </span>
      ))}

      {/* Card */}
      <div
        className="relative z-10 mx-5 max-w-sm w-full rounded-card p-8 text-center afj-pop-in"
        style={{ background: "#FFFFFF", boxShadow: "0 24px 80px rgba(0,0,0,.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sunburst behind badge */}
        <div className="relative flex items-center justify-center mb-6" style={{ height: 120 }}>
          <div
            className="afj-ray-spin absolute"
            style={{
              width: 110, height: 110,
              background: `conic-gradient(${ringColor}22 0deg, transparent 30deg, ${ringColor}22 60deg, transparent 90deg, ${ringColor}22 120deg, transparent 150deg, ${ringColor}22 180deg, transparent 210deg, ${ringColor}22 240deg, transparent 270deg, ${ringColor}22 300deg, transparent 330deg)`,
              borderRadius: "50%",
            }}
          />
          {/* Ring glow disc */}
          <div
            className="absolute"
            style={{
              width: 90, height: 90, borderRadius: "50%",
              border: `4px ${isBonus ? "dashed" : "solid"} ${ringColor}`,
              animation: `${ringAnim} 2s ease-out infinite`,
            }}
          />
          {/* Badge */}
          <div
            className="relative flex items-center justify-center rounded-full afj-pop-in"
            style={{
              width: 72, height: 72,
              background: chapter.badge.bg,
              border: `3px solid ${ringColor}`,
              fontSize: 36,
            }}
          >
            {isPathComplete ? "🏆" : chapter.badge.emoji}
          </div>
        </div>

        {isPathComplete ? (
          <>
            <div className="font-display text-3xl font-semibold mb-1" style={{ color: "#2A2A3C" }}>
              Path Complete! 🏆
            </div>
            <p className="font-sans text-sm mb-2" style={{ color: "#5C5747" }}>
              You finished all 8 core chapters and earned every badge. Amazing work!
            </p>
            <div className="flex flex-wrap gap-1 justify-center mb-4">
              {CORE_CHAPTERS.map((c) => (
                <span key={c.id} className="text-xl">{c.badge.emoji}</span>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="font-display text-3xl font-semibold mb-1" style={{ color: "#2A2A3C" }}>
              {chapter.badge.name}!
            </div>
            <p className="font-sans text-sm mb-4" style={{ color: "#5C5747" }}>
              You earned the <strong>{chapter.badge.emoji} {chapter.badge.name}</strong> badge for completing &ldquo;{chapter.title}&rdquo;.
            </p>
          </>
        )}

        <div className="flex flex-col gap-2">
          {nextCore && !isPathComplete && (
            <Link
              href={`/student/learn/${nextCore.id}`}
              className="block py-3 rounded-pill font-sans font-extrabold text-sm text-white"
              style={{ background: chapter.color, boxShadow: `0 4px 0 ${chapter.shadowColor}` }}
              onClick={onClose}
            >
              Next chapter →
            </Link>
          )}
          <Link
            href="/student/learn"
            className="block py-3 rounded-pill font-sans font-extrabold text-sm"
            style={{ background: "#F4F0FF", color: "#7C5CFF" }}
            onClick={onClose}
          >
            Back to learning path
          </Link>
          <button
            onClick={onClose}
            className="font-sans text-sm"
            style={{ color: "#8A8071" }}
          >
            Keep reading this chapter
          </button>
        </div>
      </div>
    </div>
  );
}
