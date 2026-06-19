/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E50914',
          dark: '#141414',
          gray: '#2F2F2F',
        }
      },
      transitionProperty: {
        'width': 'width'
      }
    },
  },
  plugins: [],
}
