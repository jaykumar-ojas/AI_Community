/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors:{
        customGray: 'rgb(208, 211, 214)',
        transparent: 'transparent',
        current: 'currentColor',
         white: '#ffffff',
         purple: '#3f3cbb',
         midnight: '#121063',
         metal: '#565584',
         tahiti: '#3ab7bf',
         silver: '#ecebff',
         bubblegum: '#ff77e9',
         bermuda: '#78dcca',
      }
    },
  },
  plugins: [],
}

