"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession, signOut } from "@/lib/auth-client";
import type { ProjectDSL } from "@/lib/runtime/types";
import { HelpButton } from "@/components/help-button";

// Dynamically import Blockly — no SSR
const BlocklyEditor = dynamic(() => import("@/components/blocks/blockly-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <div className="text-4xl animate-pulse">🧩</div>
        <div className="font-sans text-sm" style={{ color: "#8A8071" }}>Loading blocks…</div>
      </div>
    </div>
  ),
});

const BLOCK_PALETTE = [
  { type: "afj_goal", label: "Goal", color: "#FFC53D", icon: "🎯", hint: "What your AI Worker will do" },
  { type: "afj_knowledge", label: "Knowledge", color: "#3DA5F4", icon: "📚", hint: "Facts it should know" },
  { type: "afj_rule", label: "Safety Rule", color: "#FF6B6B", icon: "🛡", hint: "Rules it must follow" },
  { type: "afj_ask_student", label: "Ask Student", color: "#9B6DFF", icon: "❓", hint: "Ask the learner something" },
  { type: "afj_explain", label: "Explain", color: "#18B5A0", icon: "💡", hint: "Explain the topic" },
  { type: "afj_quiz", label: "Quiz", color: "#FF924D", icon: "🎯", hint: "Test what they learned" },
  { type: "afj_output", label: "Output", color: "#46C46A", icon: "✅", hint: "Final message" },
  { type: "afj_approval_required", label: "Approval", color: "#5B6BE6", icon: "👤", hint: "Needs teacher OK" },
];

const SAFETY_CHECKS = [
  { label: "No harmful content", ok: true },
  { label: "Age-appropriate language", ok: true },
  { label: "No personal data collected", ok: true },
  { label: "Daily run limit enforced", ok: true },
];

type SaveState = "saved" | "saving" | "unsaved";

function InspectorContent({
  dsl,
  blockCount,
  id,
  onRun,
}: {
  dsl: ProjectDSL | null;
  blockCount: number;
  id: string;
  onRun: () => void;
}) {
  return (
    <>
      {/* Inspector */}
      <div className="p-4 border-b-2" style={{ borderColor: "#F0E7D6" }}>
        <div className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "#8A8071" }}>
          INSPECTOR
        </div>

        {dsl?.goal ? (
          <div className="rounded-block p-3" style={{ background: "#FBF6EC", border: "2px solid #FFC53D33" }}>
            <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
              GOAL
            </div>
            <div className="font-sans text-sm" style={{ color: "#2A2A3C" }}>
              {dsl.goal}
            </div>
          </div>
        ) : (
          <div className="rounded-block p-3 text-center" style={{ background: "#FBF6EC", border: "2px dashed #F0E7D6" }}>
            <div className="font-sans text-sm" style={{ color: "#8A8071" }}>
              Select a block to inspect it, or start by adding a Goal block.
            </div>
          </div>
        )}

        {dsl && dsl.knowledge.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
              KNOWLEDGE ({dsl.knowledge.length})
            </div>
            {dsl.knowledge.map((k, i) => (
              <div key={i} className="rounded-block px-3 py-2 font-sans text-xs" style={{ background: "#EFF7FF", color: "#1F6FB0", border: "2px solid #3DA5F422" }}>
                {k.content}
              </div>
            ))}
          </div>
        )}

        {dsl && dsl.rules.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
              SAFETY RULES ({dsl.rules.length})
            </div>
            {dsl.rules.map((r, i) => (
              <div key={i} className="rounded-block px-3 py-2 font-sans text-xs" style={{ background: "#FFF0F0", color: "#C0443A", border: "2px solid #FF6B6B22" }}>
                {r}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety checklist */}
      <div className="p-4 border-b-2" style={{ borderColor: "#F0E7D6" }}>
        <div className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "#8A8071" }}>
          SAFETY CHECKLIST
        </div>
        <div className="space-y-2">
          {SAFETY_CHECKS.map((check) => (
            <div key={check.label} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#D1FAE5", color: "#2E9B52" }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-sans text-xs" style={{ color: "#2A2A3C" }}>{check.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DSL preview */}
      {dsl && blockCount > 0 && (
        <div className="p-4 border-b-2" style={{ borderColor: "#F0E7D6" }}>
          <div className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "#8A8071" }}>
            STEPS ({dsl.steps.length})
          </div>
          <div className="space-y-1">
            {dsl.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold flex-shrink-0" style={{ background: "#F4F0FF", color: "#7C5CFF" }}>
                  {i + 1}
                </div>
                <span className="font-sans text-xs capitalize" style={{ color: "#2A2A3C" }}>
                  {step.type.replace(/_/g, " ")}
                  {"style" in step ? ` (${step.style})` : ""}
                  {"question_count" in step ? ` · ${step.question_count}q` : ""}
                  {"prompt" in step ? `: "${step.prompt.slice(0, 30)}…"` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run panel */}
      <div className="mt-auto p-4" style={{ background: "#FBF6EC", borderTop: "2px solid #F0E7D6" }}>
        <button
          onClick={onRun}
          className="w-full py-3.5 rounded-pill font-sans font-extrabold text-white text-base flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
          style={{ background: "#46C46A", boxShadow: "0 5px 0 #2E9B52" }}
        >
          <span>▶</span> Run my AI Worker
        </button>
        <div className="font-mono text-[10px] uppercase tracking-widest text-center mt-3" style={{ color: "#8A8071" }}>
          You get a set number of runs each day — a grown-up can change it.
        </div>

        <div className="mt-4 p-3 rounded-block" style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}>
          <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            TIP
          </div>
          <div className="font-sans text-xs" style={{ color: "#5C5747" }}>
            Start with a <span style={{ color: "#FFC53D", fontWeight: 700 }}>Goal</span> block, add{" "}
            <span style={{ color: "#3DA5F4", fontWeight: 700 }}>Knowledge</span>, then build your{" "}
            <span style={{ color: "#9B6DFF", fontWeight: 700 }}>steps</span>.
          </div>
        </div>
      </div>
    </>
  );
}

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonReturn = searchParams.get("lesson");
  const { data: session } = useSession();

  const [project, setProject] = useState<{
    id: string;
    name: string;
    description: string | null;
    dslJson: ProjectDSL | null;
    blocklyJson: object | null;
    status: string;
    shareStatus: string | null;
    updatedAt: string;
  } | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  const [dsl, setDsl] = useState<ProjectDSL | null>(null);
  const [blocklyJson, setBlocklyJson] = useState<object | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [blockCount, setBlockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDsl = useRef<ProjectDSL | null>(null);
  const latestBlocklyJson = useRef<object | null>(null);
  const addBlockRef = useRef<((type: string) => void) | null>(null);
  const clearBlocksRef = useRef<(() => void) | null>(null);
  const resizeWorkspaceRef = useRef<(() => void) | null>(null);
  const setScaleRef = useRef<((scale: number) => void) | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [paletteExpanded, setPaletteExpanded] = useState(true);

  const handleWorkspaceReady = useCallback(
    ({ addBlock, clearBlocks, resizeWorkspace, setScale }: { addBlock: (type: string) => void; clearBlocks: () => void; resizeWorkspace: () => void; setScale: (scale: number) => void }) => {
      addBlockRef.current = addBlock;
      clearBlocksRef.current = clearBlocks;
      resizeWorkspaceRef.current = resizeWorkspace;
      setScaleRef.current = setScale;
    },
    []
  );

  // Load project
  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setProject(p);
        setDsl(p.dslJson as ProjectDSL);
        setBlocklyJson(p.blocklyJson as object | null);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load project");
        setLoading(false);
      });
  }, [id, session]);

  // Auto-save with debounce
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("unsaved");
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await fetch(`/api/projects/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dslJson: latestDsl.current,
            blocklyJson: latestBlocklyJson.current,
          }),
        });
        setSaveState("saved");
      } catch {
        setSaveState("unsaved");
      }
    }, 1200);
  }, [id]);

  const handleDslChange = useCallback(
    (newDsl: ProjectDSL) => {
      latestDsl.current = newDsl;
      setDsl(newDsl);
      // Count meaningful blocks
      const count =
        (newDsl.goal ? 1 : 0) +
        newDsl.knowledge.length +
        newDsl.rules.length +
        newDsl.steps.length +
        newDsl.approval_required.length;
      setBlockCount(count);
      scheduleSave();
    },
    [scheduleSave]
  );

  const handleBlocklyChange = useCallback(
    (json: object) => {
      latestBlocklyJson.current = json;
      setBlocklyJson(json);
    },
    []
  );

  useEffect(() => {
    const check = () => setPaletteExpanded(window.innerWidth >= 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getSaveLabel = () => {
    if (saveState === "saving") return "SAVING…";
    if (saveState === "unsaved") return "UNSAVED";
    if (project?.updatedAt) {
      const mins = Math.round((Date.now() - new Date(project.updatedAt).getTime()) / 60000);
      if (mins < 1) return "SAVED JUST NOW";
      if (mins === 1) return "SAVED 1 MIN AGO";
      return `SAVED ${mins} MIN AGO`;
    }
    return "SAVED";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFFDF7" }}>
        <div className="text-center space-y-4">
          <div className="text-5xl animate-pulse">🧩</div>
          <div className="font-sans" style={{ color: "#5C5747" }}>Loading your workspace…</div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFFDF7" }}>
        <div className="text-center space-y-4">
          <div className="text-5xl">😕</div>
          <div className="font-display text-2xl" style={{ color: "#2A2A3C" }}>Project not found</div>
          <Link href="/student/projects" style={{ color: "#7C5CFF" }} className="font-sans underline">
            Back to my workers
          </Link>
        </div>
      </div>
    );
  }

  const openInspector = () => {
    setInspectorOpen(true);
    setTimeout(() => resizeWorkspaceRef.current?.(), 50);
  };
  const closeInspector = () => {
    setInspectorOpen(false);
    setTimeout(() => resizeWorkspaceRef.current?.(), 300);
  };

  return (
    <>
    {/* ── PHONE GATE (< 768px) ── */}
    <div
      className="flex md:hidden min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ background: "#FFFDF7" }}
    >
      <div className="text-6xl">🖥️</div>
      <h1 className="font-display text-2xl font-semibold" style={{ color: "#2A2A3C" }}>
        Let&apos;s build on a bigger screen!
      </h1>
      <p className="font-sans text-base max-w-xs" style={{ color: "#5C5747" }}>
        Building your AI Worker needs a tablet or computer so you have room for all the blocks.
        Come back on one of those and we&apos;ll be ready! 🧩
      </p>
      <Link
        href="/student/projects"
        className="px-6 py-3 rounded-pill font-sans font-extrabold text-white"
        style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B3FCC" }}
      >
        ← Back to my Workers
      </Link>
    </div>

    {/* ── REAL EDITOR (≥ 768px) ── */}
    <div className="hidden md:flex flex-col h-screen overflow-hidden" style={{ background: "#FFFDF7", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* ── TOPBAR ── */}
      <header
        className="flex-shrink-0 h-16 flex items-center justify-between px-4"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6", zIndex: 10 }}
      >
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={lessonReturn ? `/student/learn/${lessonReturn}` : "/student/projects"}
            className="flex-shrink-0 rounded-block flex items-center gap-1.5 px-2 h-9 transition-colors font-sans text-sm font-extrabold"
            style={{ color: "#7C5CFF" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F4F0FF"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {lessonReturn ? "Back to lesson" : "Workers"}
          </Link>

          <div
            className="flex-shrink-0 w-9 h-9 rounded-block flex items-center justify-center"
            style={{ background: "#7C5CFF" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="white" opacity="0.9" />
              <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity="0.9" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="font-display text-[19px] leading-tight truncate" style={{ color: "#2A2A3C" }}>
              {project.name}
            </div>
            <div
              className="font-mono text-[10px] uppercase tracking-widest"
              style={{ color: saveState === "unsaved" ? "#E0792B" : "#8A8071" }}
            >
              {project.status.toUpperCase()} · {getSaveLabel()}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {project.status === "published" && (() => {
            const ss = project.shareStatus;
            if (ss === "approved") {
              return <span className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs" style={{ background: "#D1FAE5", color: "#2E9B52" }}>In gallery ✓</span>;
            }
            if (ss === "pending") {
              return <span className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs" style={{ background: "#F0E7D6", color: "#8A8071" }}>Waiting for teacher ⏳</span>;
            }
            const isRejected = ss === "rejected";
            return (
              <div className="flex flex-col items-end gap-0.5">
                {isRejected && <span className="font-sans text-[10px]" style={{ color: "#E0792B" }}>Your teacher had a note</span>}
                <button
                  disabled={shareLoading}
                  onClick={async () => {
                    setShareLoading(true);
                    try {
                      const r = await fetch(`/api/projects/${id}/share`, { method: "POST" });
                      if (r.ok) setProject((p) => p ? { ...p, shareStatus: "pending" } : p);
                    } finally { setShareLoading(false); }
                  }}
                  className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs transition-transform hover:-translate-y-0.5"
                  style={{ background: isRejected ? "#FFF0E0" : "transparent", color: isRejected ? "#E0792B" : "#7C5CFF", border: `2px solid ${isRejected ? "#E0792B" : "#7C5CFF"}` }}
                >
                  {isRejected ? "Resubmit →" : "Share with class →"}
                </button>
              </div>
            );
          })()}
          <HelpButton
            screenKey="student-editor"
            title="Block editor"
            tips={[
              { icon: "🌟", title: "Try a template", body: "New workers can start from a template — Homework Helper, Story Buddy, Science Explainer, Word Coach, or AI Buddy. Pick one when you make a new worker." },
              { icon: "🎯", title: "Start with Goal", body: "Click Goal in the left palette, then type what your AI Worker should help with." },
              { icon: "🛡", title: "Add a Safety Rule", body: "Every worker needs at least one rule before it can run. Example: \"Only answer questions about science\" or \"Never give the final answer to a homework question.\"" },
              { icon: "🧩", title: "Add steps", body: "Ask Student, Explain, Quiz, or Output — they run in the order you place them." },
              { icon: "👆", title: "Drag to connect", body: "Drag one block under another to stack them. Right-click a block to delete just that one." },
              { icon: "💾", title: "Auto-saved", body: "Look at the top-left for SAVED / SAVING… — you don't need to press save." },
            ]}
          />
          <Link
            href={`/student/projects/${id}/run`}
            className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white transition-transform hover:-translate-y-0.5"
            style={{ background: "#46C46A", boxShadow: "0 3px 0 #2E9B52" }}
          >
            ▶ Run
          </Link>
          <button
            onClick={() => signOut().then(() => router.push("/sign-in"))}
            className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs transition-colors"
            style={{ background: "#F0E7D6", color: "#5C5747" }}
          >
            Sign out
          </button>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-sans font-extrabold text-sm"
            style={{ background: "#F4F0FF", color: "#7C5CFF" }}
          >
            {session?.user?.name?.[0]?.toUpperCase() || "S"}
          </div>
        </div>
      </header>

      {/* ── MAIN THREE-COLUMN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── PALETTE COLUMN ── */}
        <aside
          className={`flex-shrink-0 flex flex-col overflow-y-auto transition-[width] duration-200 ${paletteExpanded ? "w-[248px]" : "w-[52px]"}`}
          style={{ background: "#FBF6EC", borderRight: "2px solid #F0E7D6" }}
        >
          {/* Toggle */}
          <div className="p-2 flex justify-center border-b-2" style={{ borderColor: "#F0E7D6" }}>
            <button
              onClick={() => { setPaletteExpanded((e) => !e); setTimeout(() => resizeWorkspaceRef.current?.(), 220); }}
              className="w-9 h-9 rounded-block flex items-center justify-center font-bold text-base transition-colors"
              style={{ background: "#F0E7D6", color: "#5C5747" }}
              title={paletteExpanded ? "Collapse palette" : "Expand palette"}
            >
              {paletteExpanded ? "‹" : "›"}
            </button>
          </div>

          {paletteExpanded && (
            <div className="p-4 pb-2">
              <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>BLOCKS</div>
              <div className="font-sans text-xs" style={{ color: "#5C5747" }}>Click a block to add it. Drag blocks to connect them. Right-click to delete.</div>
            </div>
          )}

          <div className="p-2 space-y-2">
            {BLOCK_PALETTE.map((block) =>
              paletteExpanded ? (
                <div
                  key={block.type}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-block cursor-pointer select-none transition-transform hover:-translate-y-0.5 active:translate-y-0"
                  style={{ background: "#FFFFFF", border: `2px solid ${block.color}22`, boxShadow: `0 3px 0 ${block.color}44` }}
                  title={block.hint}
                  onClick={() => addBlockRef.current?.(block.type)}
                >
                  <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base flex-shrink-0" style={{ background: block.color }}>
                    <span style={{ filter: "brightness(0) invert(1)" }}>{block.icon}</span>
                  </div>
                  <div>
                    <div className="font-sans font-extrabold text-sm leading-tight" style={{ color: "#2A2A3C" }}>{block.label}</div>
                    <div className="font-sans text-xs" style={{ color: "#8A8071" }}>{block.hint}</div>
                  </div>
                </div>
              ) : (
                <div
                  key={block.type}
                  className="w-9 h-9 mx-auto rounded-[10px] flex items-center justify-center cursor-pointer text-base transition-transform hover:-translate-y-0.5"
                  style={{ background: block.color, minHeight: "44px", minWidth: "44px" }}
                  title={block.hint}
                  onClick={() => addBlockRef.current?.(block.type)}
                >
                  <span style={{ filter: "brightness(0) invert(1)" }}>{block.icon}</span>
                </div>
              )
            )}
          </div>

          <div className="p-2 mt-auto border-t-2" style={{ borderColor: "#F0E7D6" }}>
            {paletteExpanded ? (
              confirmClear ? (
                <div className="space-y-2">
                  <div className="font-sans text-xs text-center" style={{ color: "#5C5747" }}>Remove all blocks?</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { clearBlocksRef.current?.(); setConfirmClear(false); }}
                      className="flex-1 py-1.5 rounded-pill font-sans font-extrabold text-xs text-white"
                      style={{ background: "#E5393A" }}
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="flex-1 py-1.5 rounded-pill font-sans font-extrabold text-xs"
                      style={{ background: "#F0E7D6", color: "#5C5747" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-full py-2 rounded-pill font-sans font-extrabold text-xs transition-colors"
                  style={{ background: "#FFF0F0", color: "#C0443A", border: "1.5px solid #FFCCCC" }}
                >
                  🗑 Clear canvas
                </button>
              )
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="w-9 h-9 mx-auto flex items-center justify-center rounded-block text-base"
                style={{ background: "#FFF0F0", color: "#C0443A", minHeight: "44px", minWidth: "44px" }}
                title="Clear canvas"
              >
                🗑
              </button>
            )}
          </div>
        </aside>

        {/* ── CANVAS ── */}
        <main className="flex-1 relative overflow-hidden">
          {/* Canvas background label */}
          <div
            className="absolute top-4 left-4 z-10 pointer-events-none"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
              MY AI WORKER · {blockCount} BLOCK{blockCount !== 1 ? "S" : ""}
            </div>
          </div>

          {/* Blockly workspace fills the canvas */}
          <div className="absolute inset-0">
            <BlocklyEditor
              initialBlocklyJson={blocklyJson}
              onDslChange={handleDslChange}
              onBlocklyChange={handleBlocklyChange}
              projectName={project.name}
              onWorkspaceReady={handleWorkspaceReady}
            />
          </div>

          {/* Floating inspector button — tablet only (< 1024px) */}
          <button
            className="lg:hidden absolute z-10 flex items-center gap-2 px-4 py-3 rounded-pill font-sans font-extrabold text-sm text-white shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B3FCC", minHeight: "44px", bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))", right: "1rem" }}
            onClick={openInspector}
          >
            ⚙️ Block settings
          </button>

          {/* Zoom controls */}
          <div
            className="absolute bottom-4 left-4 flex gap-2 z-10"
          >
            <button
              onClick={() => { const next = Math.min(150, zoom + 10); setZoom(next); setScaleRef.current?.(next); }}
              className="w-9 h-9 rounded-block font-sans font-extrabold text-lg flex items-center justify-center shadow-sm transition-colors"
              style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", color: "#2A2A3C" }}
            >
              +
            </button>
            <button
              onClick={() => { const next = Math.max(50, zoom - 10); setZoom(next); setScaleRef.current?.(next); }}
              className="w-9 h-9 rounded-block font-sans font-extrabold text-lg flex items-center justify-center shadow-sm transition-colors"
              style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", color: "#2A2A3C" }}
            >
              −
            </button>
            <div
              className="h-9 px-3 rounded-block flex items-center font-mono text-xs"
              style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", color: "#8A8071" }}
            >
              {zoom}%
            </div>
          </div>
        </main>

        {/* ── RIGHT RAIL — desktop only (≥ 1024px) ── */}
        <aside
          className="hidden lg:flex flex-shrink-0 w-[312px] flex-col overflow-y-auto"
          style={{ background: "#FFFFFF", borderLeft: "2px solid #F0E7D6" }}
        >
          <InspectorContent
            dsl={dsl}
            blockCount={blockCount}
            id={id}
            onRun={() => router.push(`/student/projects/${id}/run`)}
          />
        </aside>
      </div>

      {/* ── INSPECTOR DRAWER — tablet only (< 1024px) ── */}
      {inspectorOpen && (
        <>
          {/* Scrim */}
          <div
            className="lg:hidden fixed inset-0 z-20"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={closeInspector}
          />
          {/* Sheet */}
          <div
            className="lg:hidden fixed inset-y-0 right-0 z-30 w-[312px] flex flex-col overflow-y-auto shadow-2xl"
            style={{ background: "#FFFFFF", borderLeft: "2px solid #F0E7D6" }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b-2"
              style={{ borderColor: "#F0E7D6" }}
            >
              <span className="font-display text-base font-semibold" style={{ color: "#2A2A3C" }}>
                ⚙️ Block settings
              </span>
              <button
                onClick={closeInspector}
                className="w-9 h-9 rounded-full flex items-center justify-center font-sans font-bold"
                style={{ background: "#F0E7D6", color: "#5C5747" }}
                aria-label="Close inspector"
              >
                ✕
              </button>
            </div>
            <InspectorContent
              dsl={dsl}
              blockCount={blockCount}
              id={id}
              onRun={() => { closeInspector(); router.push(`/student/projects/${id}/run`); }}
            />
          </div>
        </>
      )}
    </div>
    </>
  );
}
