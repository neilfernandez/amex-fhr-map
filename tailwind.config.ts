import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#020617',
      },
      boxShadow: {
        soft: '0 20px 40px -24px rgba(15, 23, 42, 0.45)',
      },
    },
  },
  plugins: [],
} satisfies Config;
