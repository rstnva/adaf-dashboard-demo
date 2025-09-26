import type { Config } from "tailwindcss"

// Tailwind v4 uses CSS-first, but we keep this file to enforce dark mode via class
export default {
  // for Tailwind v4 CSS-first, we still set class strategy to ensure compatibility
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
