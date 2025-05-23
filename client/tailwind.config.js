/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors:{
        like_color : '#7b5cfe',
        btn_bg :'#272c32',
        bg_comment: 'hsl(222, 14.80%, 22.50%)',
        bg_comment_box: '#181a25',
        text_comment: '#f6f9ff',
        text_header: '#f1f5ff',
        time_header: '#a3a7b2',
        text_content: '#c3c7d2', // Also note: "conent" may be a typo of "content"
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

