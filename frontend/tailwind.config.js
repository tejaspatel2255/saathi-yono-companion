/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          light: '#1B355A',
          DEFAULT: '#0A1F44',
          dark: '#051026',
        },
        gold: {
          light: '#FFD066',
          DEFAULT: '#F5A623',
          dark: '#D98200',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Calibri', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
