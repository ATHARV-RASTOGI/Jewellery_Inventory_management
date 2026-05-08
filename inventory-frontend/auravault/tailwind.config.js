/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#0A0A0F",
          light: "#14141C",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F5E6A3",
          muted: "rgba(212, 175, 55, 0.15)",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        mono: ["DM Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #B5952F 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'gold-shimmer': 'shimmer 2.5s infinite linear',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}