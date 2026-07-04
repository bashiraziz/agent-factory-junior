"use client";

import type { BookChapter } from "@/lib/lessons/book-chapters";
import { CORE_CHAPTERS } from "@/lib/lessons/book-chapters";

interface Props {
  chapter: BookChapter;
  completedIds: string[];
  isPathComplete: boolean;
  pathProjectId?: string | null;
  onClose: () => void;
}

const CONFETTI = ["🎉", "⭐", "🎊", "✨", "🌟", "🎈", "💫", "🏅", "🎁", "🦋"];

export function Celebration({ chapter, completedIds, isPathComplete, pathProjectId, onClose }: Props) {
  const isBonus = chapter.track === "bonus";
  const ringColor = isPathComplete ? "#FFC53D" : isBonus ? "#18B5A0" : chapter.color;
  const ringAnim = isPathComplete ? "afjRingGlowGold" : isBonus ? "afjRingGlowTeal" : "afjRingGlowBlue";
  const nextCore = CORE_CHAPTERS.find((c) => !completedIds.includes(c.id));

  const coreCompletedCount = CORE_CHAPTERS.filter((c) => completedIds.includes(c.id)).length;
  const bonusIds = ["how-to-talk-to-ai", "who-made-this-ai", "ai-and-your-feelings", "when-not-to-use-ai"];
  const bonusCompletedCount = completedIds.filter((id) => bonusIds.includes(id)).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(42,42,60,0.85)" }}
      onClick={onClose}
    >
      {CONFETTI.map((emoji, i) => (
        <span key={i} className="afj-confetti" style={{ left: `${5 + i * 9}%`, animationDelay: `${i * 0.2}s` }}>
          {emoji}
        </span>
      ))}

      <div
        className="relative z-10 mx-5 max-w-sm w-full rounded-card p-8 text-center afj-pop-in"
        style={{ background: "#FFFFFF", boxShadow: "0 24px 80px rgba(0,0,0,.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sunburst + badge */}
        <div className="relative flex items-center justify-center mb-6" style={{ height: 120 }}>
          <div
            className="afj-ray-spin absolute"
            style={{
              width: 110, height: 110,
              background: `conic-gradient(${ringColor}22 0deg, transparent 30deg, ${ringColor}22 60deg, transparent 90deg, ${ringColor}22 120deg, transparent 150deg, ${ringColor}22 180deg, transparent 210deg, ${ringColor}22 240deg, transparent 270deg, ${ringColor}22 300deg, transparent 330deg)`,
              borderRadius: "50%",
            }}
          />
          <div
            className="absolute"
            style={{
              width: 90, height: 90, borderRadius: "50%",
              border: `4px ${isBonus ? "dashed" : "solid"} ${ringColor}`,
              animation: `${ringAnim} 2s ease-out infinite`,
            }}
          />
          <div
            className="relative flex items-center justify-center rounded-full afj-pop-in"
            style={{ width: 72, height: 72, background: chapter.badge.bg, border: `3px solid ${ringColor}`, fontSize: 36 }}
          >
            {isPathComplete ? "🏆" : chapter.badge.emoji}
          </div>
        </div>

        {isPathComplete ? (
          <>
            <div className="font-display text-3xl font-semibold mb-1" style={{ color: "#2A2A3C" }}>
              🏆 PATH COMPLETE! 🏆
            </div>
            <p className="font-sans text-sm mb-3" style={{ color: "#5C5747" }}>
              You built your AI Buddy! All 8 chapters read. All 8 badges earned.
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

        {/* Badge progress strip */}
        {!isPathComplete && chapter.track === "core" && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #F0E7D6" }}>
            <div className="font-mono text-[9px] uppercase tracking-widest mb-2 text-center" style={{ color: "#8A8071" }}>
              CORE PATH · {coreCompletedCount} OF 8 BADGES
            </div>
            <div className="flex justify-center gap-1.5">
              {CORE_CHAPTERS.map((c) => (
                <span
                  key={c.id}
                  className="text-lg"
                  style={{
                    filter: completedIds.includes(c.id) ? "none" : "grayscale(1)",
                    opacity: completedIds.includes(c.id) ? 1 : 0.45,
                  }}
                >
                  {c.badge.emoji}
                </span>
              ))}
            </div>
          </div>
        )}
        {!isPathComplete && chapter.track === "bonus" && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #F0E7D6" }}>
            <div className="font-mono text-[9px] uppercase tracking-widest mb-1 text-center" style={{ color: "#18B5A0" }}>
              ★ EXPLORER · {bonusCompletedCount} OF 4 BONUS BADGES
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-4">
          {isPathComplete ? (
            <>
              {pathProjectId && (
                <a
                  href={`/student/projects/${pathProjectId}/edit`}
                  className="block py-3 rounded-pill font-sans font-extrabold text-sm text-white text-center"
                  style={{ background: "#46C46A", boxShadow: "0 4px 0 #2E9B52" }}
                >
                  Meet your AI Buddy ▶
                </a>
              )}
              <a
                href="/student/learn"
                className="block py-3 rounded-pill font-sans font-extrabold text-sm text-center"
                style={{ background: "#F4F0FF", color: "#7C5CFF" }}
              >
                See all my badges
              </a>
            </>
          ) : isBonus ? (
            <>
              <button
                onClick={onClose}
                className="block py-3 rounded-pill font-sans font-extrabold text-sm text-white text-center w-full"
                style={{ background: "#18B5A0", boxShadow: "0 4px 0 #0E8576" }}
              >
                Keep exploring →
              </button>
              <a
                href="/student/learn"
                className="block py-3 rounded-pill font-sans font-extrabold text-sm text-center"
                style={{ background: "#F4F0FF", color: "#7C5CFF" }}
              >
                Back to path
              </a>
            </>
          ) : (
            <>
              {nextCore && (
                <a
                  href={`/student/learn/${nextCore.id}`}
                  className="block py-3 rounded-pill font-sans font-extrabold text-sm text-white text-center"
                  style={{ background: chapter.color, boxShadow: `0 4px 0 ${chapter.shadowColor}` }}
                >
                  Next chapter →
                </a>
              )}
              <a
                href="/student/learn"
                className="block py-3 rounded-pill font-sans font-extrabold text-sm text-center"
                style={{ background: "#F4F0FF", color: "#7C5CFF" }}
              >
                See my badges
              </a>
              <button onClick={onClose} className="font-sans text-sm" style={{ color: "#8A8071" }}>
                Keep reading this chapter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
