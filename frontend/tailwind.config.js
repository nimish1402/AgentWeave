/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            colors: {
                brand: {
                    50: "#f0f4ff",
                    100: "#e0e9ff",
                    400: "#6b8af7",
                    500: "#4f6ef7",
                    600: "#3b57e8",
                    700: "#2d43c9",
                },
                surface: {
                    900: "#0a0b0f",
                    800: "#12141a",
                    700: "#1a1d26",
                    600: "#222535",
                    500: "#2d3148",
                },
                accent: {
                    purple: "#a78bfa",
                    teal: "#2dd4bf",
                    orange: "#fb923c",
                    pink: "#f472b6",
                },
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-brand":
                    "linear-gradient(135deg, #6b8af7 0%, #a78bfa 100%)",
            },
            boxShadow: {
                glow: "0 0 20px rgba(107, 138, 247, 0.35)",
                "glow-sm": "0 0 10px rgba(107, 138, 247, 0.2)",
            },
            animation: {
                "fade-in": "fadeIn 0.3s ease-in-out",
                "slide-up": "slideUp 0.4s ease-out",
                pulse2: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
                slideUp: {
                    "0%": { opacity: 0, transform: "translateY(12px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};
