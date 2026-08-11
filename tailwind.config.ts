import type { Config } from "tailwindcss";
import { colors } from "./data/colors";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: colors.navy,
        blue: colors.blue,
        "off-white": colors.offWhite,
        graphite: colors.graphite,
        success: colors.success,
        muted: colors.muted,
      },
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      letterSpacing: {
        display: "-0.02em",
      },
      fontSize: {
        "display-sm": "clamp(1.75rem, 6vw, 4rem)",
        "display-md": "clamp(2.25rem, 6vw, 5.5rem)",
        "display-lg": "clamp(2.75rem, 8vw, 7rem)",
      },
      backgroundImage: {
        hex: "url('/patterns/hex.svg')",
      },
    },
  },
  plugins: [],
};

export default config;
