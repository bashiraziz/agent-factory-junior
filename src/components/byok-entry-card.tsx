"use client";

import { useState } from "react";
import { BYOKWizard } from "./byok-wizard";

export interface BYOKEntryCardProps {
  connected: boolean;
  keyTail?: string | null;
  status?: string | null;
}

export function BYOKEntryCard({ connected: initialConnected, keyTail: initialKeyTail, status: initialStatus }: BYOKEntryCardProps) {
  const [connected, setConnected] = useState(initialConnected);
  const [keyTail, setKeyTail] = useState(initialKeyTail ?? null);
  const [status, setStatus] = useState(initialStatus ?? null);
  const [showWizard, setShowWizard] = useState(false);
  const [removing, setRemoving] = useState(false);

  const isInvalid = status === "invalid";

  async function handleRemove() {
    if (removing) return;
    setRemoving(true);
    try {
      const res = await fetch("/api/provider-key", { method: "DELETE" });
      if (res.ok) {
        setConnected(false);
        setKeyTail(null);
        setStatus(null);
      }
    } finally {
      setRemoving(false);
    }
  }

  function handleSuccess() {
    // Re-fetch the GET to refresh state
    fetch("/api/provider-key")
      .then((r) => r.json())
      .then((data) => {
        if (data.connected) {
          setConnected(true);
          setKeyTail(data.keyTail ?? null);
          setStatus(data.status ?? "active");
        }
      })
      .catch(() => {
        setConnected(true);
        setStatus("active");
      });
  }

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    border: `2px solid ${isInvalid ? "#FFC53D" : "#F0E7D6"}`,
    borderRadius: 20,
    padding: "20px 22px",
    boxShadow: "0 18px 50px rgba(58,46,28,.10)",
  };

  return (
    <>
      {showWizard && (
        <BYOKWizard
          onClose={() => setShowWizard(false)}
          onSuccess={handleSuccess}
          initialConnected={connected}
          initialKeyTail={keyTail ?? undefined}
        />
      )}

      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Key icon */}
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: connected ? (isInvalid ? "#FFF9EE" : "#F4F0FF") : "#F4F0FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
          }}>
            🔑
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {!connected ? (
              <>
                <div style={{ fontFamily: "Fredoka, sans-serif", fontSize: 17, color: "#2A2A3C", fontWeight: 600 }}>
                  Use your own free AI key
                </div>
                <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 13, color: "#8A8071", marginTop: 2 }}>
                  Unlock more runs · 2 min · no payment info
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 14, color: "#2A2A3C", letterSpacing: "0.04em" }}>
                  AIza••••••••{keyTail}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  {isInvalid ? (
                    <span style={{
                      background: "#FFF9EE",
                      border: "1px solid #FFC53D",
                      color: "#7A5200",
                      borderRadius: 8,
                      padding: "2px 8px",
                      fontFamily: "Nunito, sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      ⚠️ Key stopped working — reconnect it
                    </span>
                  ) : (
                    <span style={{
                      background: "#D1FAE5",
                      color: "#2E9B52",
                      borderRadius: 8,
                      padding: "2px 8px",
                      fontFamily: "Nunito, sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      ✓ Boosted
                    </span>
                  )}
                  <span style={{ fontFamily: "Nunito, sans-serif", fontSize: 12, color: "#8A8071" }}>
                    {isInvalid ? "Key needs to be reconnected" : "Kids get more runs daily"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action button(s) */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {!connected ? (
              <button
                onClick={() => setShowWizard(true)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  background: "#7C5CFF",
                  color: "#fff",
                  fontFamily: "Nunito, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 0 #5B43E0",
                  whiteSpace: "nowrap",
                }}
              >
                Set it up →
              </button>
            ) : (
              <>
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 12,
                    background: "#FFF2F2",
                    color: "#C0392B",
                    fontFamily: "Nunito, sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "2px solid #FFD0D0",
                    cursor: removing ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {removing ? "Removing…" : "Remove"}
                </button>
                <button
                  onClick={() => setShowWizard(true)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 12,
                    background: "#F4F0FF",
                    color: "#5B43E0",
                    fontFamily: "Nunito, sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "2px solid #D8D0F0",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Update
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
