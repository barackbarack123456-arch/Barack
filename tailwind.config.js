/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4f46e5',
        'secondary': '#64748b',
        'accent': '#10b981',
        'background': '#f8fafc',
        'surface': '#ffffff'
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
