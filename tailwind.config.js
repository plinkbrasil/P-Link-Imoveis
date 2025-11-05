/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7f9",
          100: "#e9eef3",
          200: "#c9d6e1",
          300: "#a8bed0",
          400: "#6f96b0",
          500: "#3a6f91",
          600: "#285574",
          700: "#1f445d",
          800: "#18364a",
          900: "#122a3a"
        },
        accent: {
          500: "#eab308"
        }
      }
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
