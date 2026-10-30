export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        darkBg: '#0a0a0a',
        darkCard: '#1a1a1a',
        darkCard2: '#242424',
        gold: '#D4AF37',
        goldDark: '#B8941F',
        gymRed: '#DC2626',
        gymRedDark: '#991B1B',
        checkGreen: '#10B981',
        absentRed: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}