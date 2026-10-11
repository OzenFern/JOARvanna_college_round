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
      fontFamily: {
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Cascadia Code'", "'Fira Code'", "ui-monospace", "monospace"],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.5rem' }],
        'lg': ['1rem', { lineHeight: '1.75rem' }],
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.375rem', { lineHeight: '1.875rem' }],
        '3xl': ['1.625rem', { lineHeight: '2rem' }],
      },
      colors: {
        background: "#0A0E16",
        surface: "#0F141F",
        surfaceHover: "#1A2030",
        borderSubtle: "rgba(255,255,255,0.06)",
        brand: {
          red: "#EF4444",
          "red-light": "#F87171",
          amber: "#F59E0B",
          "amber-light": "#FBBF24",
          emerald: "#10B981",
          "emerald-light": "#34D399",
          blue: "#3B82F6",
          "blue-light": "#60A5FA",
        },
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '22px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.02) inset',
        'elevated': '0 4px 12px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.03) inset',
        'glow-red': '0 0 0 1px rgba(239,68,68,0.3), 0 4px 20px rgba(239,68,68,0.10)',
        'glow-emerald': '0 0 0 1px rgba(16,185,129,0.3), 0 4px 20px rgba(16,185,129,0.10)',
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease forwards',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(6px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
