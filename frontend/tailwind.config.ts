import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B0D13",
        surface: "#121620",
        surfaceHover: "#181D2B",
        borderSubtle: "#27272A", // zinc-800
        brand: {
          red: "#EF4444",
          amber: "#F59E0B",
          emerald: "#10B981",
          blue: "#3B82F6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
