/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        lapis:   { DEFAULT: '#1D6296', light: '#e8f2fb', dark: '#1a5580' },
        orange:  { DEFAULT: '#F3650A', light: '#fff1ea' },
        yankees: { DEFAULT: '#12273C' },
      },
    },
  },
  plugins: [],
};
