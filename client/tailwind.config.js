/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iig: {
          navy: '#0B2545',
          dark: '#13315C',
          blue: '#134074',
          accent: '#0066CC',
          light: '#EEF4F8',
          border: '#D0DBE5',
          bg: '#F5F7FA'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
