/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: "rgb(var(--color-parchment) / <alpha-value>)",
          deep:    "rgb(var(--color-parchment-deep) / <alpha-value>)",
          edge:    "rgb(var(--color-parchment-edge) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          muted:   "rgb(var(--color-ink-muted) / <alpha-value>)",
          faded:   "rgb(var(--color-ink-faded) / <alpha-value>)",
        },
        burgundy: {
          DEFAULT: "rgb(var(--color-burgundy) / <alpha-value>)",
          dark:    "rgb(var(--color-burgundy-dark) / <alpha-value>)",
          soft:    "rgb(var(--color-burgundy-soft) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          soft:    "rgb(var(--color-gold-soft) / <alpha-value>)",
          wash:    "rgb(var(--color-gold-wash) / <alpha-value>)",
        },
        hp: {
          healthy:  "rgb(var(--color-hp-healthy) / <alpha-value>)",
          wounded:  "rgb(var(--color-hp-wounded) / <alpha-value>)",
          critical: "rgb(var(--color-hp-critical) / <alpha-value>)",
        },
        cond: {
          buff:    "rgb(var(--color-cond-buff) / <alpha-value>)",
          neutral: "rgb(var(--color-cond-neutral) / <alpha-value>)",
          debuff:  "rgb(var(--color-cond-debuff) / <alpha-value>)",
          magic:   "rgb(var(--color-cond-magic) / <alpha-value>)",
          burn:    "rgb(var(--color-cond-burn) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif:   ['"EB Garamond"', "Georgia", "serif"],
        display: ['"Cinzel"', '"IM Fell English"', "serif"],
      },
      boxShadow: {
        page: "var(--shadow-page)",
      },
      borderRadius: { sheet: "2px" },
    },
  },
  plugins: [],
};
