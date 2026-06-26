import { cn } from "@/lib/utils";

const TINTS = [
  { bg: "#FFD7A8", text: "#9A5A12" },
  { bg: "#BFE0FB", text: "#1F6FB0" },
  { bg: "#F8C9C4", text: "#C0443A" },
  { bg: "#C8EAD8", text: "#2E9B52" },
];

function getTint(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TINTS[Math.abs(hash) % TINTS.length];
}

interface AvatarChipProps {
  name: string;
  size?: number;
  className?: string;
}

export function AvatarChip({ name, size = 36, className }: AvatarChipProps) {
  const tint = getTint(name);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-sans font-800 flex-shrink-0", className)}
      style={{
        width: size,
        height: size,
        background: tint.bg,
        color: tint.text,
        fontSize: size * 0.38,
        fontWeight: 800,
      }}
    >
      {initials}
    </div>
  );
}
