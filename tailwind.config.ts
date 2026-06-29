import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        panel: {
          bg: "#070b12",
          card: "#0d1422",
          soft: "#111b2d",
          line: "rgba(255,255,255,.1)"
        }
      },
      boxShadow: {
        glow: "0 24px 80px rgba(52, 211, 153, .12)"
      }
    }
  },
  plugins: []
};

export default config;
