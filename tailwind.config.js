/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#0F1712",
          surface: "#16211A",
          line: "#28362B",
        },
        turf: "#4C7A3D",
        flood: "#E8A33D",
        conf: {
          5: "#3D8B5F",
          4: "#6FA84D",
          3: "#E8A33D",
          2: "#D97B3D",
          1: "#C1443C",
        },
      },
      fontFamily: {
        display: ["var(--font-oswald)", "sans-serif"],
        body: ["var(--font-plex-sans)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        none: "0px",
      },
    },
  },
  plugins: [],
};
