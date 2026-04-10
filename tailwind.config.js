/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false,
  },
  cacheDir: ".docusaurus/.cache/tailwind",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          30: "#403D7D",
          50: "#5B5BB3",
          60: "#686AD2",
          DEFAULT: "#686AD2",
        },
        secondary: {
          60: "#167EB0",
          100: "#8AD2EE",
        },
        neutral: {
          10: "#1E2026",
          20: "#3D444D",
          30: "#5B6571",
          50: "#A9B2BB",
          60: "#DEE4E9",
        },
      },
      fontFamily: {
        gilroy: ["Gilroy", "sans-serif"],
      },
    },
  },
  plugins: [],
};
