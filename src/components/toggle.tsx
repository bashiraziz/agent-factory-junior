"use client";

export function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 transition-colors disabled:opacity-40"
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        background: checked ? "#46C46A" : "#D6CFC0",
      }}
    >
      <span
        className="absolute top-1 transition-all"
        style={{
          left: checked ? 22 : 4,
          width: 20,
          height: 20,
          borderRadius: 999,
          background: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(0,0,0,.2)",
        }}
      />
    </button>
  );
}
