/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'media', // or 'class' for manual dark mode toggle
  theme: {
    extend: {
      fontFamily: {
        'vazirmatn': ['Vazirmatn', 'sans-serif'],
        'noto-naskh': ['Noto Naskh Arabic', 'serif'],
        'amiri': ['Amiri', 'serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'wobble': 'wobble 1s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'wobble': {
          '0%, 100%': {
            transform: 'rotate(-3deg)',
          },
          '50%': {
            transform: 'rotate(3deg)',
          },
        },
      },
    },
  },
  plugins: [],
} 