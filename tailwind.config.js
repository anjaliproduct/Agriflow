/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F4EA",
        leaf: "#2F7D51",
        moss: "#6F8F4D",
        harvest: "#E8C766",
        field: "#EAF3E4",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.06), 0 12px 30px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};
