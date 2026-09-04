import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--anp-paper)",
        ink: {
          DEFAULT: "var(--anp-ink)",
          muted: "var(--anp-ink-muted)",
        },
        accent: {
          DEFAULT: "var(--anp-accent)",
          dark: "var(--anp-accent-dark)",
        },
        sage: {
          DEFAULT: "var(--anp-sage)",
          dark: "var(--anp-sage-dark)",
        },
        muted: "var(--anp-muted)",
        line: "var(--anp-line)",
      },
      fontFamily: {
        // Display humanista con carácter, para nombres/títulos.
        voice: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        // Sans utilitario para el resto de la UI.
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        // Mono condensado para datos: grupo sanguíneo, token, countdown.
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        tag: "999px",
      },
    },
  },
  plugins: [],
} satisfies Config;
