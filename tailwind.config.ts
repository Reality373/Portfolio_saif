import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0A0F',
          900: '#101015',
          800: '#131318',
          700: '#1B1B22',
          600: '#26262E',
          500: '#3A3A45',
        },
        paper: {
          DEFAULT: '#F2F2F2',
          muted: '#8A8A96',
          dim: '#5C5C68',
        },
        amber: {
          DEFAULT: '#FF6B35',
          dim: '#CC5529',
          soft: 'rgba(255, 107, 53, 0.12)',
        },
        trace: {
          DEFAULT: '#4CC9F0',
          dim: '#3AA0C0',
          soft: 'rgba(76, 201, 240, 0.12)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(76, 201, 240, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(76, 201, 240, 0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
    },
  },
  plugins: [],
}
export default config
