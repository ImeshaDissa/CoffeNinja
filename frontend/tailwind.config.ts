import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          500: '#8c5a3c',
          600: '#6f452c',
          700: '#563420',
          800: '#3e2517',
          900: '#27170e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
