import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: 'rgb(var(--color-ink-950) / <alpha-value>)',
          900: 'rgb(var(--color-ink-900) / <alpha-value>)',
          800: 'rgb(var(--color-ink-800) / <alpha-value>)',
          700: 'rgb(var(--color-ink-700) / <alpha-value>)',
          600: 'rgb(var(--color-ink-600) / <alpha-value>)',
          500: 'rgb(var(--color-ink-500) / <alpha-value>)',
        },
        paper: {
          DEFAULT: 'rgb(var(--color-paper) / <alpha-value>)',
          muted: 'rgb(var(--color-paper-muted) / <alpha-value>)',
          dim: 'rgb(var(--color-paper-dim) / <alpha-value>)',
        },
        amber: {
          DEFAULT: 'rgb(var(--color-amber) / <alpha-value>)',
          dim: 'rgb(var(--color-amber-dim) / <alpha-value>)',
          soft: 'rgb(var(--color-amber) / 0.12)',
        },
        trace: {
          DEFAULT: 'rgb(var(--color-trace) / <alpha-value>)',
          dim: 'rgb(var(--color-trace-dim) / <alpha-value>)',
          soft: 'rgb(var(--color-trace) / 0.12)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(var(--grid-line-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
    },
  },
  plugins: [],
};
export default config;
