/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/entrypoints/**", "./src/components/**", "./src/assets/**"],
  theme: {
    extend: {
      colors: {
        text: "#eef3f6",
        background: "#091014",
        primary: "#9fc5db",
        secondary: "#296488",
        accent: "#3194ce",
      },
    },
  },
  plugins: [],
};
