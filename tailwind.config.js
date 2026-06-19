/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // toggled manually via a class on <html> (light/dark/system)
  // Theme classes are built by string concatenation (e.g. `peer-checked:${theme.bg}`
  // and `hover:${theme.text}`), so the scanner can't see the final class. Safelist
  // every per-theme variant that is composed dynamically.
  safelist: [
    'peer-checked:bg-indigo-500', 'peer-checked:bg-slate-500', 'peer-checked:bg-blue-600',
    'peer-checked:bg-green-600', 'peer-checked:bg-red-600',
    'hover:text-indigo-500', 'hover:text-slate-500', 'hover:text-blue-600',
    'hover:text-green-600', 'hover:text-red-600',
  ],
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