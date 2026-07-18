import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // The desk — deep hunter green, the dark ground everything sits on
        desk: {
          DEFAULT: "#10201B",
          raised: "#172B24",
          line: "#24382F",
        },
        // Memo paper — the light material actions are written on
        paper: {
          DEFAULT: "#F2EDE0",
          shade: "#E7E0CE",
          line: "#D8CFB8",
        },
        // Typewriter ink on paper
        ink: {
          DEFAULT: "#1D1B14",
          soft: "#6B6553",
        },
        // Polished brass — Donna's accent metal
        brass: {
          DEFAULT: "#C2A25B",
          bright: "#E6C87F",
          deep: "#8A6F35",
        },
        // Red editing pencil — skip, fail, overdue
        pencil: "#B23A26",
        // Muted green-grey text on the desk
        sage: "#8FA396",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        memo: "3px",
      },
      boxShadow: {
        memo: "0 1px 0 rgba(29,27,20,0.12), 0 8px 24px -12px rgba(0,0,0,0.5)",
        "memo-lift": "0 2px 0 rgba(29,27,20,0.1), 0 20px 44px -16px rgba(0,0,0,0.55)",
        lamp: "0 0 80px 12px rgba(230,200,127,0.13)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out both",
        breathe: "breathe 4s ease-in-out infinite",
        stamp: "stamp 0.38s cubic-bezier(0.2, 1.6, 0.35, 1) both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        stamp: {
          "0%": { opacity: "0", transform: "scale(1.9) rotate(-14deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-6deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
