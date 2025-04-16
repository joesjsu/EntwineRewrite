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
        /* Richer primary purple and expanded palette */
        purple: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#7c3aed", // Updated to match new --primary
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#2e1065",
        },
        /* New accent colors */
        'accent-purple': 'var(--color-accent-purple)',
        'accent-pink': 'var(--color-accent-pink)',
        'accent-coral': 'var(--color-accent-coral)',
        'accent-teal': 'var(--color-accent-teal)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        /* Expanded neutrals */
        neutral: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        /* Shadcn UI colors (Referencing CSS Variables for consistency) */
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "0.875rem",
        md: "calc(0.875rem - 2px)",
        sm: "calc(0.875rem - 4px)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      backgroundImage: {
        'gradient-primary': "var(--gradient-primary)",
        'gradient-accent': "var(--gradient-accent)",
        'gradient-soft': "var(--gradient-soft)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;