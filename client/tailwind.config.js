/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors:{
        bg_dark: '#000000',
        low_text:'#dadadb',
        theme_color:'#fe711d',
        theme_color2 : '#fe792a',
        theme_color3:'#fe863e',   
        theme_color4:'#fe9352',
        theme_hover:'#ec7c3cff',
        theme_dark_color:'#fe5f04ff',
        nav_hover:'#0d0d0d',
        nav_hover2:'#262626ff',
        bg_sidebar:'#040f13',
        nav_color: '#585763',
        bg_scroll : '#20232d',
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
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        pop: "pop 0.4s ease-in-out",
      },
      fontFamily: {
        // --- Modern UI Sans-Serif ---
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        nunito: ['"Nunito Sans"', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        worksans: ['"Work Sans"', 'sans-serif'],
        urbanist: ['Urbanist', 'sans-serif'],
        dmsans: ['"DM Sans"', 'sans-serif'],
        opensans: ['"Open Sans"', 'sans-serif'],

        // --- Elegant Serif (for blog titles / premium feel) ---
        playfair: ['"Playfair Display"', 'serif'],
        merriweather: ['Merriweather', 'serif'],
        lora: ['Lora', 'serif'],

        // --- Monospace (for code, dev sections) ---
        jetbrains: ['"JetBrains Mono"', 'monospace'],
        firacode: ['"Fira Code"', 'monospace'],
        ibmplexmono: ['"IBM Plex Mono"', 'monospace'],

        // --- Default fallback ---
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ], 
}
