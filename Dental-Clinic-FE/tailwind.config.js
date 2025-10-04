export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        instrument: ['"Instrument Sans"', 'sans-serif'],
      },
      fontSize: {
        base: '18px',
      },
      colors: {
        primary: '#3366FF',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(90deg, #60ffd2, #3366ff 56%, #60ffd2)',
      },
      fontFamily: {
        instrument: ['"Instrument Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
