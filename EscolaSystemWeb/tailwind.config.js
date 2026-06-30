export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:         '#6f73d2',
        'primary-dark':  '#5a5db8',
        'primary-deep':  '#4e519e',
        secondary:       '#7681b3',
        accent:          '#83c9f4',
        'accent-light':  '#a3d5ff',
        'accent-lightest': '#d9f0ff',
        danger:          '#EF4444',
        warning:         '#F59E0B',
      }
    },
  },
  plugins: [],
}