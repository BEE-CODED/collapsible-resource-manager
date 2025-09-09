const { theme, ...theRest } = require('./vendor/laravel/nova/tailwind.config')

module.exports = {
    ...theRest,
    theme: {
        ...theme,
        extend: {
            ...theme.extend,
            transitionProperty: {
                width: 'width',
            },
        },
    },
    plugins: [
        require('@tailwindcss/container-queries'),
        require('@tailwindcss/typography'),
    ],
    important: 'div[id^="collapsible-resource-manager"]',
}
