import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pp: {
          orange: "#F26522",
          navy: "#1a2744",
        },
      },
    },
  },
  plugins: [],
};

export default config;
