import type { Config } from "tailwindcss";

export default {
  darkMode: false,
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FFFDF7",
        "paper-sunken": "#FBF6EC",
        surface: "#FFFFFF",
        ink: "#2A2A3C",
        "ink-soft": "#5C5747",
        "ink-muted": "#8A8071",
        hairline: "#F0E7D6",
        brand: "#7C5CFF",
        "brand-deep": "#5B43E0",
        run: "#46C46A",
        "run-deep": "#2E9B52",
        warn: "#E0792B",
        "warn-tint": "#FFF1DC",
        block: {
          goal: "#FFC53D",
          knowledge: "#3DA5F4",
          rule: "#FF6B6B",
          ask: "#9B6DFF",
          explain: "#18B5A0",
          quiz: "#FF924D",
          output: "#46C46A",
          approval: "#5B6BE6",
        },
      },
      fontFamily: {
        display: ["Fredoka", "sans-serif"],
        sans: ["Nunito", "sans-serif"],
        mono: ['"Space Mono"', "monospace"],
      },
      borderRadius: {
        block: "16px",
        card: "20px",
        pill: "13px",
      },
      boxShadow: {
        card: "0 18px 50px rgba(58,46,28,.12)",
        stud: "0 4px 0 rgba(0,0,0,.14)",
        btn: "0 4px 0 var(--btn-deep)",
        "btn-run": "0 5px 0 #2E9B52",
      },
    },
  },
  plugins: [],
} satisfies Config;
