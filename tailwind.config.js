/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["IBM Plex Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
        ar:      ["IBM Plex Sans Arabic", "IBM Plex Sans", "sans-serif"],
      },
      colors: {
        // Vert zellige — couleur de marque Mizan (remplace l'ancien bleu)
        mizan: {
          50:  "#ecf5f1",
          100: "#d2e8df",
          200: "#a8d2c1",
          300: "#74b59c",
          400: "#3f9476",
          500: "#1d7d5e",
          600: "#0E6B4E", // brand
          700: "#0b5a41",
          800: "#0a4d38",
          900: "#083d2c",
          950: "#052418",
        },
        // Or zellige — accent
        gold: {
          DEFAULT: "#BE9A4E",
          soft:    "#E7D9B4",
          50:  "#faf6ec",
          100: "#f1e7cb",
          200: "#e7d9b4",
          300: "#d6bd82",
          400: "#c8a862",
          500: "#BE9A4E",
          600: "#a07f3c",
          700: "#806331",
        },
        // Rouge du drapeau — accent rare
        flag: "#C1272D",
        cream: "#F7F4EC",
        ink:   "#15281F",
      },
      backgroundImage: {
        // motif octogone + losange (zellige) — vert discret
        zellij:
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%230E6B4E' stroke-opacity='0.08' stroke-width='1'%3E%3Cpolygon points='17.6,0 42.4,0 60,17.6 60,42.4 42.4,60 17.6,60 0,42.4 0,17.6'/%3E%3Crect x='22' y='22' width='16' height='16' transform='rotate(45 30 30)'/%3E%3C/g%3E%3C/svg%3E\")",
        // version claire pour fonds foncés
        "zellij-gold":
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23BE9A4E' stroke-opacity='0.10' stroke-width='1'%3E%3Cpolygon points='17.6,0 42.4,0 60,17.6 60,42.4 42.4,60 17.6,60 0,42.4 0,17.6'/%3E%3Crect x='22' y='22' width='16' height='16' transform='rotate(45 30 30)'/%3E%3C/g%3E%3C/svg%3E\")",
        "zellij-light":
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23E7D9B4' stroke-opacity='0.12' stroke-width='1'%3E%3Cpolygon points='17.6,0 42.4,0 60,17.6 60,42.4 42.4,60 17.6,60 0,42.4 0,17.6'/%3E%3Crect x='22' y='22' width='16' height='16' transform='rotate(45 30 30)'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        zellij: "0 26px 60px -34px rgba(10,77,56,0.45)",
      },
    },
  },
  plugins: [],
}
