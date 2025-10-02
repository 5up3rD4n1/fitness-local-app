/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#122118',
        'secondary-bg': '#1b3124',
        'border-primary': '#264532',
        'border-secondary': '#366348',
        'accent': '#38e07b',
        'text-secondary': '#96c5a9',
      },
      fontFamily: {
        'lexend': ['Lexend', 'sans-serif'],
        'noto': ['Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}