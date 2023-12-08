const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx}",
        "../src/extension.ts",
        "./public/index.html"
    ],
    darkMode: 'media',
    theme: {
        fontFeatureSettings: {
            DEFAULT: '"cv02", "cv03", "cv04", "cv11"',
        },
        extend: {},
    },
    plugins: [plugin(function ({ matchUtilities, theme }) {
        matchUtilities(
            {
                'font-feature-settings': (value) => ({
                    fontFeatureSettings: value
                }),
            },
            { values: theme('fontFeatureSettings') }
        )
    })],
}