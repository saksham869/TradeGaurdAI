import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        subtle: "var(--bg-subtle)",
        border: "var(--border-default)",
        "border-active": "var(--border-active)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        amber: "var(--amber)",
        bull: "var(--bull)",
        bear: "var(--bear)",
        warning: "var(--warning)",
        extreme: "var(--extreme)",
      },
    },
  },
  plugins: [],
};
export default config;
