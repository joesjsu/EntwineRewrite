import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Include components directory for Shadcn UI
    // Add other paths if necessary, e.g., "./pages/**/*.{js,ts,jsx,tsx,mdx}" if using pages dir
  ],
  theme: {
    extend: {
      // Add custom theme extensions here if needed
    },
  },
  plugins: [],
};
export default config;