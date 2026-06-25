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
          light: '#E2E8F0', // Border color
          DEFAULT: '#FFFFFF', // Card background
          dark: '#F8FAFC', // Page background
        },
        gold: {
          light: '#60A5FA', // Light cobalt highlight
          DEFAULT: '#1D4ED8', // Cobalt blue primary
          dark: '#1E3A8A', // Deep cobalt accent
        },
        copper: {
          light: '#E5C158', // Champagne/light copper
          DEFAULT: '#C89D7C', // Minimalist copper gold
          dark: '#7C2D12', // Deep copper brown
        }
      },
      fontFamily: {
        sans: ['Inter', 'Calibri', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(245, 166, 35, 0.12)',
        'gold-glow-hover': '0 0 25px rgba(245, 166, 35, 0.25)',
        'gold-border': '0 0 0 1px rgba(245, 166, 35, 0.2)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}
