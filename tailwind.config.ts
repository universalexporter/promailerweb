import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg:     { DEFAULT: '#04030a', 2: '#070512' },
        purple: { DEFAULT: '#6c3b9c', light: '#9b5de5', glow: 'rgba(108,59,156,0.35)' },
        green:  { DEFAULT: '#10b981', glow: 'rgba(16,185,129,0.30)' },
        glass:  { DEFAULT: 'rgba(255,255,255,0.035)', border: 'rgba(255,255,255,0.075)' },
        muted:  '#7a7090',
      },
      animation: {
        'pulse-dot':      'pulse-dot 2.2s ease-in-out infinite',
        'float-y':        'float-y 4s ease-in-out infinite',
        'scroll-bounce':  'scroll-bounce 2.2s ease-in-out infinite',
        'spin-slow':      'spin-slow 12s linear infinite',
        'spin-reverse':   'spin-slow 18s linear infinite reverse',
        'blink':          'blink 1s step-end infinite',
        'glow-pulse':     'glow-pulse 2s ease-in-out infinite',
        'shimmer':        'shimmer 2.2s infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%,100%': { boxShadow: '0 0 6px #10b981, 0 0 12px rgba(16,185,129,0.3)' },
          '50%':     { boxShadow: '0 0 14px #10b981, 0 0 36px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.12)' },
        },
        'float-y': {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        'scroll-bounce': {
          '0%,100%': { opacity: '0.3', transform: 'translateX(-50%) translateY(0)' },
          '50%':     { opacity: '0.7', transform: 'translateX(-50%) translateY(7px)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'blink': {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
        'glow-pulse': {
          '0%,100%': { opacity: '0.5' },
          '50%':     { opacity: '1' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      backgroundImage: {
        'radial-purple': 'radial-gradient(ellipse at center, rgba(108,59,156,0.15) 0%, transparent 70%)',
        'radial-green':  'radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, transparent 70%)',
        'glass-shine':   'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)',
      },
      boxShadow: {
        'glow-purple': '0 0 24px rgba(108,59,156,0.4), 0 4px 20px rgba(0,0,0,0.5)',
        'glow-purple-lg': '0 0 48px rgba(108,59,156,0.5), 0 0 100px rgba(108,59,156,0.15), 0 4px 24px rgba(0,0,0,0.6)',
        'glow-green':  '0 0 24px rgba(16,185,129,0.4), 0 4px 20px rgba(0,0,0,0.5)',
        'glow-green-lg': '0 0 48px rgba(16,185,129,0.5), 0 4px 24px rgba(0,0,0,0.6)',
        'glass':       'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}

export default config