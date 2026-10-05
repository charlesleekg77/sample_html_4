/** @type {import('tailwindcss').Config} */

// The whole site is sized in rem, where the root font-size is fluid:
//   html { font-size: clamp(5px, 20px, 10 * 100vw / var(--size)) }
// so 1rem === 10px at the design widths (390 mobile / 1500 desktop).
// Numeric utilities therefore map N -> N/10 rem, e.g. text-16 = 1.6rem,
// rounded-20 = 2rem, w-700 = 70rem.
const spacing = {}
for (let i = 0; i <= 1200; i++) spacing[i] = `${i / 10}rem`

const fontSize = {}
for (let i = 6; i <= 120; i++) fontSize[i] = `${i / 10}rem`

const lineHeight = {}
for (let i = 6; i <= 120; i++) lineHeight[i] = `${i / 10}rem`

const borderRadius = {}
for (let i = 0; i <= 200; i++) borderRadius[i] = `${i / 10}rem`

export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    screens: {
      s: '650px',
    },
    spacing,
    fontSize,
    lineHeight,
    borderRadius,
    extend: {
      zIndex: {
        1: '1',
        99: '99',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        paper: '#eee',
        gold: '#d9a441',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
