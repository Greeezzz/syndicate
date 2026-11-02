import type { Config } from "tailwindcss";

// Design tokens dari DESIGN.md (SYNDICATE — dark neobrutalist)
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        syndicate: {
          bg: "#0B0B0D",
          surface: "#202024",
          border: "#45454D",
          muted: "#85858D",
          text: "#E8E8EC",
          active: "#10B981",
          pending: "#F59E0B",
          agreed: "#06B6D4",
          error: "#EF4444",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Geist Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
