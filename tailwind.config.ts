/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--color-fg)',
        card: {
          DEFAULT: 'var(--color-bg-card)',
          foreground: 'var(--color-fg)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-border)',
        ring: 'var(--color-accent)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-fg)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-fg)',
        },
        destructive: {
          DEFAULT: '#D94848',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: 'var(--color-bg-card)',
          foreground: 'var(--color-fg)',
        },
        primary: {
          DEFAULT: 'var(--color-accent)',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: [''Inter'', 'system-ui', '-apple-system', 'sans-serif'],
        heading: [''Space Grotesk'', 'system-ui', 'sans-serif'],
        mono: [''JetBrains Mono'', 'monospace'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.25rem',
        lg: '0.375rem',
        xl: '0.5rem',
        '2xl': '0.75rem',
        full: '9999px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

module.exports = config
