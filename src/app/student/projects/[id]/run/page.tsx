"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Mascot } from "@/components/mascot";
import { StatusPill } from "@/components/status-pill";
import { HelpButton } from "@/components/help-button";

type QuizQuestion = { q: string; choices: string[]; answer: number; explanation?: string };
type WorkerMessage =
  | { role: "worker"; content: string }
  | { role: "user"; content: string }
  | { role: "quiz"; questions: QuizQuestion[] };

interface RunResult {
  runId: string;
  messages: WorkerMessage[];
  safetyFlags: string[];
  runsUsedToday: number;
  dailyRunLimit: number;
  provider: string;
}

function QuizCard({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.answer).length
    : 0;

  return (
    <div
      className="rounded-card p-5 my-3"
      style={{ background: "#FFF6E6", border: "2px solid #FFC53D44" }}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#8A8071" }}>
        🎯 QUIZ TIME — {questions.length} QUESTIONS
      </div>
      <div className="space-y-5">
        {questions.map((q, qi) => {
          const gotIt = submitted && answers[qi] === q.answer;
          return (
            <div key={qi}>
              <div className="font-sans font-extrabold text-sm mb-2" style={{ color: "#2A2A3C" }}>
                {qi + 1}. {q.q}
              </div>
              <div className="space-y-2">
                {q.choices.map((choice, ci) => {
                  const isSelected = answers[qi] === ci;
                  const isCorrect = ci === q.answer;
                  let bg = "#FFFFFF";
                  let border = "#F0E7D6";
                  let textColor = "#2A2A3C";
                  if (submitted) {
                    if (isCorrect) { bg = "#D1FAE5"; border = "#46C46A"; textColor = "#2E9B52"; }
                    else if (isSelected && !isCorrect) { bg = "#FEE2E2"; border = "#FF6B6B"; textColor = "#C0443A"; }
                  } else if (isSelected) {
                    bg = "#F4F0FF"; border = "#7C5CFF"; textColor = "#7C5CFF";
                  }
                  return (
                    <button
                      key={ci}
                      onClick={() => !submitted && setAnswers((a) => ({ ...a, [qi]: ci }))}
                      disabled={submitted}
                      className="w-full text-left px-4 py-2.5 rounded-block font-sans text-sm transition-all"
                      style={{ background: bg, border: `2px solid ${border}`, color: textColor }}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + ci)}.</span>
                      {choice}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <div
                  className="mt-2 p-3 rounded-block flex gap-2 items-start"
                  style={{
                    background: gotIt ? "#ECFDF5" : "#FEF3C7",
                    border: `2px solid ${gotIt ? "#46C46A44" : "#FFC53D66"}`,
                  }}
                >
                  <span className="text-base flex-shrink-0">{gotIt ? "✅" : "💡"}</span>
                  <div className="font-sans text-xs leading-relaxed" style={{ color: "#5C5747" }}>
                    <span className="font-extrabold" style={{ color: gotIt ? "#2E9B52" : "#E0792B" }}>
                      {gotIt ? "Nice — " : "Why: "}
                    </span>
                    {q.explanation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="mt-4 w-full py-2.5 rounded-pill font-sans font-extrabold text-sm text-white disabled:opacity-40"
          style={{ background: "#FF924D", boxShadow: "0 3px 0 #CC6B2A" }}
        >
          Submit Answers
        </button>
      ) : score === questions.length ? (
        <div
          className="mt-4 p-6 rounded-card text-center relative overflow-hidden afj-pop-in"
          style={{
            background: "linear-gradient(180deg, #FFF6E6 0%, #D1FAE5 100%)",
            border: "3px solid #46C46A",
            boxShadow: "0 6px 0 #2E9B52, 0 20px 40px rgba(46,155,82,.15)",
          }}
        >
          {/* Confetti burst */}
          {["🎉", "⭐", "🎊", "✨", "🌟", "🎈", "💫", "🏅"].map((emoji, i) => (
            <span
              key={i}
              className="afj-confetti"
              style={{
                left: `${8 + i * 11}%`,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              {emoji}
            </span>
          ))}
          <div className="relative z-10">
            <div className="text-6xl mb-2">
              <span className="afj-trophy-bounce">🏆</span>
            </div>
            <div className="font-display text-3xl font-semibold mb-1" style={{ color: "#2E9B52" }}>
              Perfect Score!
            </div>
            <div className="font-sans text-sm font-extrabold" style={{ color: "#5C5747" }}>
              {score}/{questions.length} — you got them all! 🌟
            </div>
          </div>
        </div>
      ) : (
        <div
          className="mt-4 p-3 rounded-block text-center"
          style={{ background: "#FFF6E6" }}
        >
          <div className="font-display text-xl font-semibold" style={{ color: "#E0792B" }}>
            {score}/{questions.length} correct{" "}
            {score >= questions.length / 2 ? "👍" : "Keep going! 💪"}
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(raw: string): string {
  const lines = escapeHtml(raw).split("\n");
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    const h = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    const li = /^[*-]\s+(.*)$/.exec(trimmed);
    if (h) {
      closeList();
      const level = Math.min(6, h[1].length);
      const size = level <= 2 ? "1.05rem" : level === 3 ? "1rem" : "0.95rem";
      out.push(
        `<div style="font-family:Fredoka,sans-serif;font-weight:600;font-size:${size};color:#2A2A3C;margin:0.75rem 0 0.25rem;">${h[2]}</div>`
      );
    } else if (li) {
      if (!inList) {
        out.push('<ul style="margin:0.25rem 0 0.5rem 1.1rem;padding:0;list-style:disc;">');
        inList = true;
      }
      out.push(`<li style="margin:0.15rem 0;">${li[1]}</li>`);
    } else if (trimmed === "") {
      closeList();
      out.push("<br />");
    } else {
      closeList();
      out.push(line + "<br />");
    }
  }
  closeList();
  return out.join("").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function MessageBubble({ msg }: { msg: WorkerMessage }) {
  if (msg.role === "quiz") {
    return <QuizCard questions={msg.questions} />;
  }
  if (msg.role === "user") {
    return (
      <div className="flex gap-3 items-start justify-end">
        <div
          className="max-w-[80%] rounded-card rounded-tr-sm px-4 py-3 font-sans text-sm"
          style={{
            background: "#7C5CFF",
            color: "#FFFFFF",
            lineHeight: 1.6,
          }}
        >
          {msg.content}
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
          style={{ background: "#FFF6E6", border: "2px solid #FFC53D66" }}
        >
          🧒
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 items-start">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
        style={{ background: "#F4F0FF", border: "2px solid #7C5CFF22" }}
      >
        🤖
      </div>
      <div
        className="flex-1 rounded-card rounded-tl-sm px-4 py-3 font-sans text-sm"
        style={{
          background: "#FFFFFF",
          border: "2px solid #7C5CFF22",
          color: "#2A2A3C",
          lineHeight: 1.6,
        }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
      />
    </div>
  );
}

export default function RunProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();

  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("AI Worker");
  const [hasQuizStep, setHasQuizStep] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const userReplyCount = result?.messages.filter((m) => m.role === "user").length ?? 0;
  const hasInitialQuiz = result?.messages.some((m) => m.role === "quiz") ?? false;
  const showAdvance = !!result && !advanced && userReplyCount >= 1 && !sending;
  const showNudge = !!result && !advanced && userReplyCount === 0 && !sending;
  const visibleMessages = advanced
    ? result?.messages ?? []
    : (result?.messages ?? []).filter((m) => m.role !== "quiz");

  const advance = async () => {
    if (!result || advanced || sending) return;
    if (hasInitialQuiz) {
      setAdvanced(true);
      return;
    }
    setSending(true);
    const phase: "quiz" | "output" = hasQuizStep ? "quiz" : "output";
    try {
      const res = await fetch(`/api/projects/${id}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: result.messages.filter(
            (m) => m.role === "worker" || m.role === "user"
          ),
          phase,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to advance");
      const newMsg: WorkerMessage =
        data.kind === "quiz"
          ? { role: "quiz", questions: data.questions }
          : { role: "worker", content: data.content };
      setResult((r) => (r ? { ...r, messages: [...r.messages, newMsg] } : r));
      setAdvanced(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setResult((r) =>
        r ? { ...r, messages: [...r.messages, { role: "worker", content: `😕 ${msg}` }] } : r
      );
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !result || sending) return;
    setSending(true);
    setInput("");
    const userMsg: WorkerMessage = { role: "user", content: text };
    const history = [...result.messages, userMsg];
    setResult({ ...result, messages: history });
    try {
      const res = await fetch(`/api/projects/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: result.messages.filter(
            (m) => m.role === "worker" || m.role === "user"
          ),
          userMessage: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reply");
      const workerMsg: WorkerMessage = { role: "worker", content: data.content };
      setResult((r) => (r ? { ...r, messages: [...r.messages, workerMsg] } : r));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setResult((r) =>
        r ? { ...r, messages: [...r.messages, { role: "worker", content: `😕 ${msg}` }] } : r
      );
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!session?.user) return;

    // Fetch project metadata (name + whether a quiz step exists)
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setProjectName(p.name || "AI Worker");
        const steps = (p.dslJson?.steps ?? []) as Array<{ type: string }>;
        setHasQuizStep(steps.some((s) => s.type === "quiz"));
      })
      .catch(() => {});

    // Run the worker
    fetch(`/api/projects/${id}/run`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Something went wrong");
        setLoading(false);
      });
  }, [id, session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFFDF7" }}>
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">🤖</div>
          <div className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
            Running your AI Worker…
          </div>
          <div className="font-sans text-sm" style={{ color: "#5C5747" }}>
            Checking safety rules and building your session
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FFFDF7" }}>
        <div
          className="w-full max-w-md rounded-card p-8 text-center"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
        >
          <div className="text-5xl mb-4">😕</div>
          <div className="font-display text-2xl mb-2" style={{ color: "#2A2A3C" }}>Oops!</div>
          <div className="font-sans mb-6" style={{ color: "#5C5747" }}>{error}</div>
          <Link
            href={`/student/projects/${id}/edit`}
            className="inline-block px-6 py-3 rounded-pill font-sans font-extrabold text-white"
            style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
          >
            ← Back to Editor
          </Link>
        </div>
      </div>
    );
  }

  const runsLeft = result ? result.dailyRunLimit - result.runsUsedToday : 0;
  const hasSafetyFlags = (result?.safetyFlags?.length ?? 0) > 0;

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        {/* Purple-tinted run header */}
        <div
          className="px-6 py-4 flex items-center gap-4"
          style={{ background: "#F4F0FF" }}
        >
          <Mascot size={48} />
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl font-semibold truncate" style={{ color: "#2A2A3C" }}>
              {projectName}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#7C5CFF" }}>
              RUNNING SAFELY · {(result?.provider ?? "mock").toUpperCase()} MODEL
            </div>
          </div>
          <StatusPill status={hasSafetyFlags ? "flagged" : "safe"} />
          <HelpButton
            screenKey="student-run"
            title="Running your worker"
            tips={[
              { icon: "🤖", title: "What you see", body: "Your AI Worker is following the steps you built. It answers using only your approved knowledge and rules." },
              { icon: "💬", title: "Chat back", body: "Type in the box at the bottom and press Send to reply. You can go back and forth as many times as you want." },
              { icon: "🎯", title: "Ready for the quiz?", body: "After you've chatted at least once, tap the big 'Ready for the quiz?' (or 'Wrap it up!') button to move on." },
              { icon: "💡", title: "Wrong answer? No problem", body: "Each wrong quiz question shows a friendly 'Why:' so you learn the right answer." },
              { icon: "🏆", title: "Perfect score", body: "Get every quiz answer right and you'll see a bouncing trophy with confetti!" },
              { icon: "🔁", title: "Replay", body: "Click 'See replay' to see exactly what steps ran and what rules were checked." },
              { icon: "⚡", title: "Runs left", body: "You get 5 runs per day by default — your parent can change this. Counter is at the bottom." },
            ]}
          />
        </div>

        {/* Nav bar */}
        <div className="px-6 py-2 flex items-center gap-3">
          <Link
            href={`/student/projects/${id}/edit`}
            className="font-sans text-sm font-extrabold"
            style={{ color: "#7C5CFF" }}
          >
            ← Edit
          </Link>
          <div className="flex-1" />
          <Link
            href={`/student/projects/${id}/replay/${result?.runId}`}
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: "#8A8071" }}
          >
            See replay →
          </Link>
        </div>
      </header>

      {/* Chat area */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {visibleMessages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {result && result.messages.length === 0 && (
          <div
            className="rounded-card p-8 text-center"
            style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
          >
            <div className="text-4xl mb-3">🤔</div>
            <div className="font-display text-xl mb-2" style={{ color: "#2A2A3C" }}>
              No output yet
            </div>
            <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
              Add steps to your AI Worker — try an Ask Student block or Explain block.
            </p>
            <Link
              href={`/student/projects/${id}/edit`}
              className="inline-block mt-4 px-5 py-2.5 rounded-pill font-sans font-extrabold text-sm text-white"
              style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
            >
              ← Back to Editor
            </Link>
          </div>
        )}
      </main>

      {/* Chat input + Footer */}
      <div
        className="sticky bottom-0"
        style={{ background: "#FFFFFF", borderTop: "2px solid #F0E7D6" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          {showNudge && (
            <div
              className="mb-3 rounded-block px-4 py-2.5 flex items-center gap-2 justify-center text-center"
              style={{ background: "#FFF6E6", border: "2px solid #FFC53D66" }}
            >
              <span className="text-lg">💬</span>
              <div className="font-sans text-sm" style={{ color: "#5C5747" }}>
                <span className="font-extrabold" style={{ color: "#2A2A3C" }}>Your turn!</span>{" "}
                Read what your worker said, then type a question or what you learned to move on.
              </div>
            </div>
          )}
          {showAdvance && (
            <div className="mb-3 flex justify-center">
              <button
                onClick={advance}
                className="px-5 py-2.5 rounded-pill font-sans font-extrabold text-sm text-white transition-transform hover:-translate-y-0.5"
                style={{
                  background: hasQuizStep ? "#FF924D" : "#46C46A",
                  boxShadow: hasQuizStep ? "0 4px 0 #CC6B2A" : "0 4px 0 #2E9B52",
                }}
              >
                {hasQuizStep ? "🎯 Ready for the quiz?" : "🎁 Wrap it up!"}
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                sending
                  ? "Worker is thinking…"
                  : showNudge
                  ? "Type a question or what you learned…"
                  : "Type your reply…"
              }
              disabled={sending || !result}
              className="flex-1 px-4 py-3 rounded-pill font-sans text-sm outline-none disabled:opacity-60"
              style={{
                background: "#FBF6EC",
                border: "2px solid #F0E7D6",
                color: "#2A2A3C",
              }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim() || !result}
              aria-label="Send"
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
            >
              {sending ? "…" : "➤"}
            </button>
          </form>
        </div>
        <div
          className="px-6 py-2 flex items-center justify-between"
          style={{ borderTop: "1px solid #F0E7D6" }}
        >
          <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "#8A8071" }}>
            {runsLeft} OF {result?.dailyRunLimit ?? 5} RUNS LEFT TODAY
          </div>
          {result?.runId && (
            <Link
              href={`/student/projects/${id}/replay/${result.runId}`}
              className="font-sans text-sm font-extrabold"
              style={{ color: "#7C5CFF" }}
            >
              See replay →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
