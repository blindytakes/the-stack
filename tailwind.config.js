module.exports = {
  content: ['./src/**/*.{ts,tsx}', './content/**/*.mdx'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0A0F',
          elevated: '#12121A',
          surface: '#1A1A26'
        },
        brand: {
          teal: '#2DD4BF',
          gold: '#D4A853',
          coral: '#E8634A'
        },
        text: {
          primary: '#F1F1F3',
          secondary: '#A1A1B5',
          muted: '#6B6B80'
        }
      },
      fontFamily: {
        heading: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif']
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'card-hover': 'cardHover 0.3s ease-out forwards'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        cardHover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' }
        }
      }
    }
  },
  plugins: []
};
