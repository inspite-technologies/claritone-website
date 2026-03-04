/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#E31E24", // Claritone Red
                secondary: "#005696", // Deep Blue
                "background-light": "#F9FAFB",
                "background-dark": "#111827",
            },
            fontFamily: {
                display: ["Lexend", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
            },
        },
    },
    plugins: [],
}
