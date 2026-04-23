import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem" },
      screens: {
        sm: "100%",
        md: "100%",
        lg: "1170px",
        xl: "1170px",
        "2xl": "1170px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        pp: {
          orange: "#FF520B",
          "orange-hover": "#E54A0A",
          navy: "#222D57",
          amber: "#FFA733",
          body: "#484848",
          dark: "#161616",
          offwhite: "#F8F8F8",
          footer: "#333333",
        },
      },
      borderRadius: {
        "pp-button": "5px",
        "pp-button-lg": "10px",
        "pp-card": "10px",
        "pp-card-lg": "20px",
        "pp-pill": "49px",
        "pp-modal": "25px",
      },
      boxShadow: {
        "pp-card": "0 0 20px -4px rgba(0, 0, 0, 0.27)",
        "pp-card-soft": "0 0 20px -4px rgba(21, 27, 54, 0.12)",
        "pp-card-very-soft": "0 0 20px -4px rgba(0, 0, 0, 0.05)",
      },
      maxWidth: {
        "pp-container": "1170px",
      },
      letterSpacing: {
        "pp-tight": "-0.5px",
        "pp-tighter": "-1px",
        "pp-nav": "0.5px",
      },
    },
  },
  plugins: [],
};

export default config;
