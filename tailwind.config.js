/**
 * @file Tailwind CSS configuration that scans the source templates for class names.
 */
/** @import * as tailwindcss from 'tailwindcss'; */
/** @type {tailwindcss.Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
