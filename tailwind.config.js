/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'uacc-red': '#CC2200',
        'uacc-gold': '#C9973A',
        'uacc-gold-light': '#f4be5d',
        'surface': '#0f131c',
        'surface-low': '#181c24',
        'surface-container': '#1c2028',
        'on-surface': '#dfe2ee',
        'on-surface-variant': '#A0AEC0',
      },
      jscolors: {
        'uacc-red': '#CC2200',
        'uacc-gold': '#C9973A',
        'uacc-gold-light': '#f4be5d',
        'surface': '#0f131c',
        'surface-low': '#181c24',
        'surface-container': '#1c2028',
        'on-surface': '#dfe2ee',
        'on-surface-variant': '#A0AEC0',
      },
      fontFamily: {
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
