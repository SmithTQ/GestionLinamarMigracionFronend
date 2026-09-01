/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 40px rgba(15, 23, 42, 0.12)',
        glow: '0 10px 30px rgba(34, 76, 255, 0.25)',
      },
      backgroundImage: {
        'radial-fade':
          'radial-gradient(circle at top, rgba(34, 76, 255, 0.08), rgba(21, 196, 183, 0.06), transparent 70%)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        linamar: {
          primary: '#224cff',
          secondary: '#4f6d7a',
          'secondary-content': '#ffffff',
          accent: '#1f2f87',
          neutral: '#0f172a',
          'base-100': '#ffffff',
          'base-200': '#f4f6fb',
          'base-300': '#e2e8f0',
          info: '#2563eb',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          '--rounded-box': '1.5rem',
          '--rounded-btn': '0.9rem',
          '--rounded-badge': '999px',
          '--tab-radius': '0.9rem',
        },
      },
      {
        'linamar-dark': {
          primary: '#5b7cff',
          secondary: '#22b3a7',
          'secondary-content': '#071a1d',
          accent: '#6d7dff',
          neutral: '#e2e8f0',
          'base-100': '#0b1220',
          'base-200': '#111a2e',
          'base-300': '#18233b',
          info: '#60a5fa',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#f87171',
          '--rounded-box': '1.5rem',
          '--rounded-btn': '0.9rem',
          '--rounded-badge': '999px',
          '--tab-radius': '0.9rem',
        },
      },
    ],
    darkTheme: 'linamar-dark',
  },
};
