"use client";

import type { BookChapter } from "@/lib/lessons/book-chapters";

interface Props {
  chapter: BookChapter;
  readChecked: boolean;
  onReadToggle: () => void;
}

const CALLOUT_STYLES = {
  remember: {
    bg: "#FFF1DC",
    bar: "#E0792B",
    text: "#B5560F",
    icon: "⚠️ Remember!",
  },
  try: {
    bg: "#E7F8ED",
    bar: "#46C46A",
    text: "#2E7D46",
    icon: "✨ Try this!",
  },
  safe: {
    bg: "#F4F0FF",
    bar: "#7C5CFF",
    text: "#5B43E0",
    icon: "🛡️ Stay safe!",
  },
};

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

export function ReaderPane({ chapter, readChecked, onReadToggle }: Props) {
  const callout = CALLOUT_STYLES[chapter.callout.kind];

  function handleTTS() {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(chapter.paragraphs.join(" "));
    window.speechSynthesis.speak(u);
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "2px solid #F0E7D6",
        borderRadius: 16,
        padding: 28,
      }}
    >
      <div className="space-y-4">
        {chapter.paragraphs.map((p, i) => (
          <p
            key={i}
            className="font-sans"
            style={{ fontSize: 17, lineHeight: 1.65, color: "#2A2A3C" }}
          >
            {p}
          </p>
        ))}
      </div>

      {/* TTS button */}
      <button
        onClick={handleTTS}
        className="mt-4 font-sans text-sm"
        style={{ color: "#8A8071", background: "none", border: "none", cursor: "pointer" }}
      >
        🔊 Tap to hear this page read aloud
      </button>

      {/* Callout */}
      <div
        className="mt-4 flex gap-3 items-start rounded-block"
        style={{
          background: callout.bg,
          padding: "12px 14px",
          borderRadius: 10,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 4,
            alignSelf: "stretch",
            background: callout.bar,
            borderRadius: 3,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            className="font-sans text-xs font-bold mb-0.5"
            style={{ color: callout.text }}
          >
            {callout.icon}
          </div>
          <p className="font-sans text-sm" style={{ color: callout.text }}>
            {chapter.callout.text}
          </p>
        </div>
      </div>

      {/* Read check */}
      <div className="mt-4">
        <CheckRow
          checked={readChecked}
          onToggle={onReadToggle}
          label="I read this chapter"
        />
      </div>
    </div>
  );
}
