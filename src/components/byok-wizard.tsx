"use client";

import { useState, useEffect, useCallback } from "react";

// ── Inline keyframe animations injected once ──────────────────────────────────
const STYLES = `
@keyframes afjFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}
@keyframes afjSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes afjShake {
  0%,100% { transform: translateX(0); }
  20%     { transform: translateX(-8px); }
  40%     { transform: translateX(8px); }
  60%     { transform: translateX(-6px); }
  80%     { transform: translateX(6px); }
}
@keyframes afjPopIn {
  0%   { transform: scale(0.6); opacity: 0; }
  70%  { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
`;

// Key format regex — same as server side
const KEY_FORMAT = /^AIza[0-9A-Za-z_\-]{20,}$/;

function formatHint(val: string): { icon: string; text: string; valid: boolean } {
  if (val.length === 0) return { icon: "✏️", text: "Paste your key above", valid: false };
  if (!val.startsWith("AIza")) return { icon: "🤔", text: 'Google keys start with "AIza" — double-check!', valid: false };
  if (!KEY_FORMAT.test(val)) return { icon: "✏️", text: "Keep going — almost long enough…", valid: false };
  return { icon: "✅", text: "Looks good! Hit Test to check it with Google.", valid: true };
}

// Progress dots
function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 8,
            width: i === step ? 28 : 8,
            borderRadius: 4,
            background: i < step ? "#46C46A" : i === step ? "#7C5CFF" : "#F0E7D6",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export interface BYOKWizardProps {
  onClose: () => void;
  onSuccess: () => void;
  initialConnected?: boolean;
  initialKeyTail?: string;
}

export function BYOKWizard({ onClose, onSuccess, initialConnected: _ic, initialKeyTail: _ikt }: BYOKWizardProps) {
  const [step, setStep] = useState(0);
  const [keyInput, setKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [successTail, setSuccessTail] = useState("");

  // Inject keyframe CSS once
  useEffect(() => {
    const id = "afj-byok-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const hint = formatHint(keyInput.trim());

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }, []);

  async function handleTest() {
    const trimmed = keyInput.trim();
    if (!hint.valid) {
      triggerShake();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/provider-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again!");
        triggerShake();
        return;
      }
      setSuccessTail(data.keyTail ?? trimmed.slice(-4));
      setStep(3);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  // Overlay backdrop
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(42,42,60,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#FBF6EC",
          border: "2px solid #F0E7D6",
          borderRadius: 24,
          padding: "36px 32px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 20px 60px rgba(42,42,60,0.25)",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "#F0E7D6",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
            fontSize: 18,
            color: "#8A8071",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        <ProgressDots step={step} />

        {/* ── Step 0: Intro ──────────────────────────────────────────────────── */}
        {step === 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, animation: "afjFloat 2.5s ease-in-out infinite", marginBottom: 16 }}>🎁</div>
            <h2 style={{ fontFamily: "Fredoka, sans-serif", fontSize: 28, color: "#2A2A3C", marginBottom: 8 }}>
              Unlock more runs — for free
            </h2>
            <p style={{ fontFamily: "Nunito, sans-serif", color: "#5C5747", marginBottom: 24 }}>
              Connect your own Google AI Studio key so your students can keep building even after the daily limit. Takes 2 minutes!
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
              {[
                { icon: "💸", label: "100% free", sub: "No payment info" },
                { icon: "⏱", label: "2 minutes", sub: "Setup time" },
                { icon: "🛡", label: "Same safety", sub: "All rules enforced" },
              ].map((tile) => (
                <div
                  key={tile.label}
                  style={{
                    background: "#FFFFFF",
                    border: "2px solid #F0E7D6",
                    borderRadius: 16,
                    padding: "14px 8px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{tile.icon}</div>
                  <div style={{ fontFamily: "Fredoka, sans-serif", fontSize: 14, color: "#2A2A3C", fontWeight: 600 }}>{tile.label}</div>
                  <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 11, color: "#8A8071" }}>{tile.sub}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                background: "#7C5CFF",
                color: "#fff",
                fontFamily: "Fredoka, sans-serif",
                fontSize: 18,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 0 #5B43E0",
                marginBottom: 10,
              }}
            >
              Let&apos;s do it →
            </button>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 14,
                background: "transparent",
                color: "#8A8071",
                fontFamily: "Nunito, sans-serif",
                fontSize: 14,
                border: "2px solid #F0E7D6",
                cursor: "pointer",
              }}
            >
              Maybe later
            </button>
          </div>
        )}

        {/* ── Step 1: Get key ────────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "Fredoka, sans-serif", fontSize: 26, color: "#2A2A3C", marginBottom: 6 }}>
              Get your free key
            </h2>
            <p style={{ fontFamily: "Nunito, sans-serif", color: "#5C5747", marginBottom: 20 }}>
              Follow these 3 steps on Google AI Studio:
            </p>

            {[
              { n: 1, text: "Sign in with your Google account (the grown-up account, not the student's)" },
              { n: 2, text: 'Click "Create API key" — it\'s the big blue button' },
              { n: 3, text: 'Copy the key that starts with "AIza…"' },
            ].map((s) => (
              <div key={s.n} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#7C5CFF",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Fredoka, sans-serif",
                  fontSize: 16,
                  flexShrink: 0,
                  marginTop: 2,
                }}>{s.n}</div>
                <p style={{ fontFamily: "Nunito, sans-serif", color: "#2A2A3C", margin: 0, lineHeight: 1.5 }}>{s.text}</p>
              </div>
            ))}

            {/* Amber warning */}
            <div style={{
              background: "#FFF9EE",
              border: "2px solid #FFC53D55",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 22,
              fontFamily: "Nunito, sans-serif",
              fontSize: 13,
              color: "#7A5200",
            }}>
              <strong>Heads up:</strong> If you see "Google Cloud Console" instead of AI Studio, close the tab and click the link below.
            </div>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                background: "#7C5CFF",
                color: "#fff",
                fontFamily: "Fredoka, sans-serif",
                fontSize: 18,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 0 #5B43E0",
                textAlign: "center",
                textDecoration: "none",
                marginBottom: 10,
              }}
            >
              Open Google AI Studio ↗
            </a>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStep(0)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 14,
                  background: "transparent",
                  color: "#8A8071",
                  fontFamily: "Nunito, sans-serif",
                  fontSize: 14,
                  border: "2px solid #F0E7D6",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 2,
                  padding: "12px 0",
                  borderRadius: 14,
                  background: "#F0E7D6",
                  color: "#5B43E0",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                I copied my key →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Paste + test ───────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "Fredoka, sans-serif", fontSize: 26, color: "#2A2A3C", marginBottom: 6 }}>
              Paste your key
            </h2>
            <p style={{ fontFamily: "Nunito, sans-serif", color: "#5C5747", marginBottom: 18 }}>
              We&apos;ll test it with Google before saving anything.
            </p>

            <div
              style={{
                animation: shake ? "afjShake 0.5s ease" : "none",
                marginBottom: 10,
              }}
            >
              <input
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setError(null); }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text").trim();
                  setKeyInput(pasted);
                  setError(null);
                  e.preventDefault();
                }}
                placeholder="AIza…"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  borderRadius: 12,
                  border: `2px solid ${error ? "#E0792B" : hint.valid ? "#46C46A" : "#F0E7D6"}`,
                  fontFamily: "Space Mono, monospace",
                  fontSize: 13,
                  color: "#2A2A3C",
                  background: "#FFFFFF",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Live hint */}
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 13, color: hint.valid ? "#2E9B52" : "#8A8071", marginBottom: 6 }}>
              {hint.icon} {hint.text}
            </div>

            {error && (
              <div style={{
                background: "#FFF2F2",
                border: "2px solid #FFA0A0",
                borderRadius: 10,
                padding: "10px 12px",
                fontFamily: "Nunito, sans-serif",
                fontSize: 13,
                color: "#C0392B",
                marginBottom: 10,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleTest}
              disabled={!hint.valid || loading}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                background: hint.valid && !loading ? "#7C5CFF" : "#D8D0F0",
                color: "#fff",
                fontFamily: "Fredoka, sans-serif",
                fontSize: 18,
                border: "none",
                cursor: hint.valid && !loading ? "pointer" : "not-allowed",
                boxShadow: hint.valid && !loading ? "0 6px 0 #5B43E0" : "none",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: "inline-block", animation: "afjSpin 0.8s linear infinite", fontSize: 18 }}>⟳</span>
                  Saying hello to Google…
                </>
              ) : (
                "Test Key →"
              )}
            </button>

            <button
              onClick={() => setStep(1)}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 14,
                background: "transparent",
                color: "#8A8071",
                fontFamily: "Nunito, sans-serif",
                fontSize: 14,
                border: "2px solid #F0E7D6",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* ── Step 3: Success ────────────────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, animation: "afjPopIn 0.5s cubic-bezier(.34,1.56,.64,1) both", marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: "Fredoka, sans-serif", fontSize: 30, color: "#46C46A", marginBottom: 8 }}>
              It works!
            </h2>
            <p style={{ fontFamily: "Nunito, sans-serif", color: "#5C5747", marginBottom: 20 }}>
              Your key is saved safely. Your students now get more runs every day!
            </p>

            <div style={{
              background: "#FFFFFF",
              border: "2px solid #F0E7D6",
              borderRadius: 14,
              padding: "14px 18px",
              fontFamily: "Space Mono, monospace",
              fontSize: 15,
              color: "#2A2A3C",
              letterSpacing: "0.05em",
              marginBottom: 24,
            }}>
              AIza••••••••{successTail}
            </div>

            <button
              onClick={() => { onSuccess(); onClose(); }}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: 14,
                background: "#46C46A",
                color: "#fff",
                fontFamily: "Fredoka, sans-serif",
                fontSize: 18,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 0 #2E9B52",
              }}
            >
              Done ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
