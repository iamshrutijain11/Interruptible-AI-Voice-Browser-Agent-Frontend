/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0d0f14",
          900: "#151922",
          800: "#1c2129",
          700: "#262c37",
          600: "#39414f",
        },
        amber: {
          400: "#f0b555",
          500: "#e8a33d",
          600: "#c8862a",
        },
        teal: {
          400: "#6fe0d2",
          500: "#4fd1c5",
          600: "#33a89d",
        },
        coral: {
          400: "#ff8a7a",
          500: "#ef6a58",
          600: "#c94f40",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(232, 163, 61, 0.45)" },
          "70%": { boxShadow: "0 0 0 16px rgba(232, 163, 61, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(232, 163, 61, 0)" },
        },
        ambientGlow: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.4" },
          "50%": { transform: "scale(1.08)", opacity: "0.65" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ripple: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "50%": { transform: "scale(1.2)", opacity: "0.2" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite",
        ambientGlow: "ambientGlow 4s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        ripple: "ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite",
      },
    },
  },
  plugins: [],
}
