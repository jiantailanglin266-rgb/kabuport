import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Japan Equity Intelligence palette
        navy: {
          DEFAULT: "#0b1b3a",
          900: "#081226",
          800: "#0b1b3a",
          700: "#122a55",
        },
        indigo: { DEFAULT: "#3949ab", 400: "#5c6bc0" },
        brand: { DEFAULT: "#2563eb", cyan: "#06b6d4", emerald: "#10b981", amber: "#f59e0b" },
        up: "#e11d48", // 上昇(日本慣習: 赤)。色のみに依存せず記号/矢印/ラベル併用
        down: "#059669", // 下落(緑)
        ink: "var(--ink)",
        muted: "var(--muted)",
        bg: "var(--bg)",
        card: "var(--card)",
        line: "var(--line)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
    },
  },
  plugins: [],
};

export default config;
