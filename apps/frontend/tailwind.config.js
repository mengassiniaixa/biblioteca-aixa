/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./.storybook/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // paleta minimal B/N con acento rojo
        ink: {
          DEFAULT: "#0A0A0A",   // texto principal, botones primarios
          soft: "#171717",      // texto casi negro (neutral-900)
          mid: "#404040",       // texto secundario (neutral-700)
          muted: "#737373",     // texto terciario / labels (neutral-500)
          faint: "#A3A3A3",     // placeholders / disabled (neutral-400)
        },
        paper: {
          DEFAULT: "#FFFFFF",   // fondo cards
          soft: "#FAFAFA",      // fondo body (neutral-50)
          mid: "#F5F5F5",       // fondo hover suave (neutral-100)
          edge: "#E5E5E5",      // bordes (neutral-200)
        },
        accent: {
          DEFAULT: "#EF4444",   // acento (red-500)
          hover: "#DC2626",     // hover (red-600)
          soft: "#FEE2E2",      // bg suave para tags de peligro (red-100)
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
        pop: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        DEFAULT: "0.375rem",
      },
    },
  },
  plugins: [],
};
