import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Include components directory for Shadcn UI
    // Add other paths if necessary, e.g., "./pages/**/*.{js,ts,jsx,tsx,mdx}" if using pages dir
  ],
  theme: {
    extend: {
      colors: {
        // Custom purple color palette (Keep existing if needed, or replace if the CSS vars cover it)
        purple: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6", // Corresponds to --primary in light mode
          600: "#7c3aed", // Corresponds to --primary in dark mode? Check globals.css
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // Added Accent & Functional Colors (Referencing CSS Variables)
        'accent-purple': 'var(--color-accent-purple)',
        'accent-pink': 'var(--color-accent-pink)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        // Shadcn UI colors (Referencing CSS Variables for consistency)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "calc(0.625rem - 2px)",
        sm: "calc(0.625rem - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;