/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#E6EEF8",
        input: "#E6EEF8",
        ring: "#2B6CB0",
        background: "#FFFFFF",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#6FB7E8",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#D6B8FF",
          foreground: "#0F172A",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F6F9",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#9FEAD3",
          foreground: "#0F172A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
