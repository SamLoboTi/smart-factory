/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0e17', // Darker blue/black background
        surface: '#111827', // Card background
        primary: '#3b82f6', // Bright blue
        secondary: '#10b981', // Green
        accent: '#f59e0b', // Amber/Orange
        danger: '#ef4444', // Red
        muted: '#94a3b8', // Gray text
        'card-gradient-start': 'rgba(30, 41, 59, 0.7)',
        'card-gradient-end': 'rgba(15, 23, 42, 0.7)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.5)',
        'glow-danger': '0 0 15px rgba(239, 68, 68, 0.5)',
      }
    },
  },
  plugins: [],
}
