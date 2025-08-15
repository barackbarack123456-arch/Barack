/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3490dc',
        secondary: '#6c757d',
        accent: '#38c172',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
    },
  },
  plugins: [],
}
