/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Black & White Design System
        'primary': '#000000',
        'primary-blue': '#000000', // Keep for backward compatibility, but use black
      },
    },
  },
  plugins: [],
}

