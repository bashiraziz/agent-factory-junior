"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Mascot } from "@/components/mascot";
import { StatusPill } from "@/components/status-pill";

type WorkerMessage =
  | { role: "worker"; content: string }
  | { role: "quiz"; questions: Array<{ q: string; choices: string[]; answer: number }> };

interface RunResult {
  runId: string;
  messages: WorkerMessage[];
  safetyFlags: string[];
  runsUsedToday: number;
  dailyRunLimit: number;
}

function QuizCard({ questions }: { questions: Array<{ q: string; choices: string[]; answer: number }> }) {
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
        {questions.map((q, qi) => (
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
          </div>
        ))}
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
      ) : (
        <div
          className="mt-4 p-3 rounded-block text-center"
          style={{ background: score === questions.length ? "#D1FAE5" : "#FFF6E6" }}
        >
          <div className="font-display text-xl font-semibold" style={{ color: score === questions.length ? "#2E9B52" : "#E0792B" }}>
            {score}/{questions.length} correct{" "}
            {score === questions.length ? "🎉" : score >= questions.length / 2 ? "👍" : "Keep going! 💪"}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: WorkerMessage }) {
  if (msg.role === "quiz") {
    return <QuizCard questions={msg.questions} />;
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
        dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br />"),
        }}
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

  useEffect(() => {
    if (!session?.user) return;

    // Fetch project name
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((p) => setProjectName(p.name || "AI Worker"))
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
              RUNNING SAFELY · MOCK MODEL
            </div>
          </div>
          <StatusPill status={hasSafetyFlags ? "flagged" : "safe"} />
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
        {result?.messages.map((msg, i) => (
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

      {/* Footer */}
      <footer
        className="sticky bottom-0 px-6 py-4 flex items-center justify-between"
        style={{ background: "#FFFFFF", borderTop: "2px solid #F0E7D6" }}
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
      </footer>
    </div>
  );
}
