/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mc: {
          bg: "#0B0B0C",
          surface: "#18181B",
          accent: "#7C3AED",
          indigo: "#4F46E5",
          text: "#F4F4F5",
          muted: "#A1A1AA"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(124,58,237,.20)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};