/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        radar: {
          darkest: '#090D16',
          dark: '#0F172A',
          card: '#131D31',
          border: '#1E293B',
          hover: '#1E293B',
          textMuted: '#94A3B8',
          textDim: '#64748B',
        },
        brand: {
          blue: '#3B82F6',
          cyan: '#06B6D4',
          violet: '#8B5CF6',
          indigo: '#6366F1',
        }
      },
    },
  },
  plugins: [],
}
