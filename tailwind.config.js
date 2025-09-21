/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem"
    },
    extend: {
      fontFamily: {
        // Pretendard Variable 우선 + 시스템 폰트
        sans: ["Pretendard Variable", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Apple SD Gothic Neo", "Segoe UI", "Noto Sans KR", "Roboto", "Helvetica Neue", "Arial", "sans-serif"]
      },
      colors: {
        brand: {
          50:  "#eefcf6",
          100: "#d7f7ea",
          200: "#b0ebd4",
          300: "#85dfbf",
          400: "#4fcca1",
          500: "#10b981",   // emerald-500 베이스
          600: "#0e9f6e",
          700: "#0b815a",
          800: "#0a6a4a",
          900: "#084f39"
        }
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem"
      },
      boxShadow: {
        soft: "0 4px 16px rgba(0,0,0,0.06)"
      }
    }
  },
  plugins: []
};
