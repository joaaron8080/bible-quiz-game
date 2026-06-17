import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          DEFAULT: "#B8960C",
          primary: "#B8960C",
          light: "#D4A017",
        },
        cream: {
          DEFAULT: "#FDF8EE",
          primary: "#FDF8EE",
          light: "#FDF8EE",
          dark: "#F5EDD8",
        },
        brown: {
          dark: "#3D2B1F",
        },
      },
    },
  },
  plugins: [],
};
export default config;
