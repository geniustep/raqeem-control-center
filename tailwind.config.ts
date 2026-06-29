import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-arabic)",
          "Tahoma",
          "Segoe UI",
          "system-ui",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec3ff",
          400: "#59a2ff",
          500: "#3380fb",
          600: "#1d61f0",
          700: "#164bdc",
          800: "#193eb2",
          900: "#1a388c",
          950: "#142455",
        },
      },
    },
  },
  plugins: [],
};

export default config;
