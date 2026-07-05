/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // match Instagram's native system font (Segoe UI on Windows)
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        ig: {
          blue: "#0095f6",
          bluedark: "#1877f2",
          pink: "#e1306c",
          border: "#dbdbdb",
          gray: "#8e8e8e",
          bg: "#fafafa",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
