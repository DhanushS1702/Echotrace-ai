/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#030712',
        cardBg: '#0B0F19',
        cardBorder: 'rgba(255, 255, 255, 0.08)',
        cyanAccent: '#00D4FF',
        skyHighlight: '#38BDF8',
        indigoAccent: '#4F46E5',
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#38bdf8',
          500: '#00d4ff',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(0, 212, 255, 0.35)',
        glowIndigo: '0 0 25px -5px rgba(79, 70, 229, 0.4)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-spin': 'glow-spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
