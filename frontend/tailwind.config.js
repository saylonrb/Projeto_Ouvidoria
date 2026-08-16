/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f7ef',
          100: '#ccefdc',
          200: '#99e0b9',
          300: '#66d096',
          400: '#33c173',
          500: '#00a650', // Cor principal (verde da marca)
          600: '#008540',
          700: '#006430',
          800: '#004220',
          900: '#002110',
        },
        accent: {
          blue: '#2B54A6',
          yellow: '#FBB03B',
          brown: '#8B5A2B',
        },
        gray: {
          900: '#1a1a1a',
          800: '#333333', // Texto escuro
          700: '#4a4a4a',
          600: '#666666',
          500: '#8c8c8c',
          400: '#b3b3b3',
          300: '#cccccc',
          200: '#e6e6e6',
          100: '#f5f5f5',
          50: '#fafafa',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
