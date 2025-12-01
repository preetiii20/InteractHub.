/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        'ih-primary': '#4f46e5', // Indigo-600
        'ih-secondary': '#10b981', // Emerald-500
        'ih-dark': '#1f2937', // Gray-800
      },
    },
  },
  plugins: [],
}