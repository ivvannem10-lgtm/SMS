import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {

      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif:   ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },

      colors: {
        // ── Deep university navy sidebar ───────────────────────────────────
        sidebar: {
          bg:      '#0c1e3d',
          hover:   '#132748',
          active:  '#1a3259',
          border:  '#1e3a6a',
          text:    '#7898c0',
          muted:   '#3d5a80',
          heading: '#2c4a72',
        },

        // ── Brand primary: university navy blue ────────────────────────────
        brand: {
          50:  '#eef3fb',
          100: '#dce8f7',
          200: '#b9d1ef',
          300: '#7aaae0',
          400: '#4a80cc',
          500: '#1a4a8a',   // PRIMARY action
          600: '#163d73',
          700: '#11305c',
          800: '#0d2445',
          900: '#09182e',
        },

        // ── Gold accent (premium/institutional — use sparingly) ────────────
        gold: {
          50:  '#fdf8e8',
          100: '#faefc5',
          400: '#d4aa3a',
          500: '#c9a224',
          600: '#b08c1e',
        },

        // ── Content surfaces ───────────────────────────────────────────────
        surface: {
          DEFAULT: '#f3f6fb',
          card:    '#ffffff',
          hover:   '#eef3fa',
          dark:    '#0c1225',   // login / dark screen
        },
      },

      boxShadow: {
        'card':     '0 1px 3px 0 rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-md':  '0 4px 12px 0 rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-lg':  '0 8px 28px 0 rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        'inner':    'inset 0 1px 2px 0 rgba(0,0,0,0.05)',
        'inner-sm': 'inset 0 1px 2px 0 rgba(0,0,0,0.05)',   // alias
        'glow':     '0 0 0 3px rgba(26,74,138,0.18)',
      },

      borderRadius: {
        '2xl': '14px',   // cards
        '3xl': '20px',   // modals
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },

      animation: {
        'fade-in':      'fadeIn 0.15s ease-out',
        'slide-up':     'slideUp 0.2s ease-out',
        'slide-down':   'slideDown 0.2s ease-out',
        'pulse-ripple': 'pulseRipple 0.6s ease-out forwards',
      },

      keyframes: {
        fadeIn:      { from: { opacity: '0' },                          to: { opacity: '1' } },
        slideUp:     { from: { opacity: '0', transform: 'translateY(6px)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:   { from: { opacity: '0', transform: 'translateY(-6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseRipple: { '0%': { transform: 'scale(1)', opacity: '0.4' }, '100%': { transform: 'scale(2.4)', opacity: '0' } },
      },

      backgroundImage: {
        'navy-gradient':  'linear-gradient(135deg, #1a4a8a 0%, #0c1e3d 100%)',
        'brand-gradient': 'linear-gradient(135deg, #1a4a8a 0%, #163d73 100%)',
      },
    },
  },
  plugins: [],
}

export default config
