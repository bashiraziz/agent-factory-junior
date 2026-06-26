import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: "safe" | "flagged" | "error";
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider",
        status === "safe" && "bg-green-100 text-run",
        status === "flagged" && "bg-warn-tint text-warn",
        status === "error" && "bg-red-100 text-red-600",
        className
      )}
    >
      {status === "safe" && <span>●</span>}
      {status === "flagged" && <span>▲</span>}
      {status === "error" && <span>✕</span>}
      {status === "safe" ? "SAFE" : status === "flagged" ? "FLAG" : "ERROR"}
    </span>
  );
}
