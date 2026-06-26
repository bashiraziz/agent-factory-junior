export function Mascot({ size = 48 }: { size?: number }) {
  const scale = size / 118;
  return (
    <svg
      viewBox="0 0 118 132"
      width={size}
      height={size * (132 / 118)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Antenna */}
      <line x1="59" y1="8" x2="59" y2="22" stroke="#FFC53D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="59" cy="6" r="4" fill="#FFC53D">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Head */}
      <rect x="18" y="22" width="82" height="60" rx="20" fill="#7C5CFF" />
      {/* Ears */}
      <rect x="6" y="36" width="14" height="20" rx="7" fill="#5B43E0" />
      <rect x="98" y="36" width="14" height="20" rx="7" fill="#5B43E0" />
      {/* Face screen */}
      <rect x="28" y="30" width="62" height="44" rx="12" fill="#EAF1FF" />
      {/* Eyes */}
      <circle cx="44" cy="50" r="7" fill="#2A2A3C" />
      <circle cx="74" cy="50" r="7" fill="#2A2A3C" />
      <circle cx="46" cy="48" r="2.5" fill="white" />
      <circle cx="76" cy="48" r="2.5" fill="white" />
      {/* Smile */}
      <path d="M 44 64 Q 59 74 74 64" stroke="#2A2A3C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Body */}
      <rect x="28" y="86" width="62" height="38" rx="14" fill="#18B5A0" />
      {/* Leaf badge */}
      <ellipse cx="59" cy="96" rx="10" ry="7" fill="#46C46A" transform="rotate(-20 59 96)" />
      <line x1="59" y1="96" x2="55" y2="103" stroke="#2E9B52" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
