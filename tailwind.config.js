/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#1a2332',
        'primary-blue': '#2563eb',
      },
    },
  },
  plugins: [],
}

