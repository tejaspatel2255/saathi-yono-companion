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
          light: '#DFE3E8', // Divider / Border color
          DEFAULT: '#FFFFFF', // Card background
          dark: '#F4F6F9', // Page background canvas
        },
        gold: {
          light: '#3B82F6', // Light cobalt highlight
          DEFAULT: '#002FA7', // International Klein Blue / Vanguard Cobalt
          dark: '#001F70', // Deep midnight cobalt
        },
        copper: {
          light: '#EAD1BB', // Pale sand gold
          DEFAULT: '#D5A27A', // Sandstone copper
          dark: '#8E5D38', // Burnished bronze
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
