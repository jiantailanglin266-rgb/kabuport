import type { Config } from "tailwindcss";

/**
 * KABUPORT Design System
 * Deep Navy × Gold の金融ポータル。Bloomberg / TradingView / JPX の情報密度と
 * 大手証券の品格を両立させるためのトークン定義。
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // --- ブランド（固定色。テーマに依存しない） ---
        navy: {
          DEFAULT: "#081826",
          900: "#050F1A",
          800: "#081826",
          700: "#0C2136",
          600: "#102B46",
          500: "#17395C",
          400: "#22507F",
        },
        gold: {
          DEFAULT: "#D8B46A",
          600: "#C39E52",
          400: "#E3C589",
          200: "#F0DFBB",
        },
        primary: { DEFAULT: "#1E88E5", 600: "#1873C4", 400: "#4BA3EC" },
        success: "#00B67A",
        danger: "#E74C3C",

        // 既存ページ互換（Phase1〜6のコンポーネントが参照）。新デザインの primary/gold に揃える。
        brand: { DEFAULT: "#1E88E5", cyan: "#4BA3EC", emerald: "#00B67A", amber: "#D8B46A" },

        // 騰落（日本の慣習: 上昇=赤 / 下落=緑）。色のみに依存せず ▲▼ とラベルを併用。
        up: "#E74C3C",
        down: "#00B67A",

        // --- セマンティック（CSS変数 + <alpha-value> で /opacity 修飾子に対応） ---
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        elevated: "rgb(var(--elevated) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-2": "rgb(var(--ink-2) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-noto)", "var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "var(--font-noto)", "system-ui", "sans-serif"],
        num: ["var(--font-inter)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        xl: "14px",
        "2xl": "16px",
        "3xl": "18px",
        "4xl": "24px",
      },
      boxShadow: {
        // 影は「かなり弱め」。上品な浮遊感のみ。
        card: "0 1px 2px rgba(8,24,38,.04), 0 1px 3px rgba(8,24,38,.03)",
        lift: "0 6px 20px -6px rgba(8,24,38,.12), 0 2px 6px -2px rgba(8,24,38,.06)",
        header: "0 1px 0 rgb(var(--line)), 0 4px 16px -12px rgba(8,24,38,.18)",
        gold: "0 6px 18px -8px rgba(216,180,106,.55)",
      },
      letterSpacing: {
        tight: "-0.02em",
        wide: "0.02em",
        wider: "0.06em",
        widest: "0.16em",
      },
      maxWidth: { shell: "1360px" },
      // 既定スケールに無い不透明度（微細なガラス感・階調のために使用）
      opacity: { 8: "0.08", 12: "0.12", 15: "0.15", 18: "0.18", 22: "0.22", 45: "0.45", 55: "0.55", 65: "0.65", 85: "0.85", 92: "0.92" },
      transitionTimingFunction: {
        smooth: "cubic-bezier(.22,.61,.36,1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "draw-line": { from: { strokeDashoffset: "1200" }, to: { strokeDashoffset: "0" } },
        "grow-bar": { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
        "ticker-x": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "pulse-dot": { "0%,100%": { opacity: "1" }, "50%": { opacity: ".25" } },
        "float-y": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.22,.61,.36,1) both",
        "draw-line": "draw-line 1.8s cubic-bezier(.22,.61,.36,1) both",
        "grow-bar": "grow-bar .9s cubic-bezier(.22,.61,.36,1) both",
        ticker: "ticker-x 42s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "float-y": "float-y 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
