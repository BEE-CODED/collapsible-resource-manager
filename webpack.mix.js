let mix = require('laravel-mix')

require('./nova.mix')
require('mix-tailwindcss')

mix
  .setPublicPath('dist')
  .js('resources/js/tool.js', 'js')
  .vue({ version: 3 })
  .postCss('resources/css/card.css', 'css')
  .tailwind()
  .nova('digital-creative/collapsible-resource-manager')
  .options({
    processCssUrls: false,
    legacyNodePolyfills: false
  })
  .override(webpackConfig => {
    // Find and modify sass-loader rules
    webpackConfig.module.rules.forEach(rule => {
      if (rule.test && rule.test.toString().includes('scss')) {
        if (rule.use) {
          rule.use.forEach(loader => {
            if (loader.loader && loader.loader.includes('sass-loader')) {
              loader.options = {
                ...loader.options,
                implementation: require('sass'),
                api: 'modern'
              }
            }
          })
        }
        if (rule.oneOf) {
          rule.oneOf.forEach(oneOfRule => {
            if (oneOfRule.use) {
              oneOfRule.use.forEach(loader => {
                if (loader.loader && loader.loader.includes('sass-loader')) {
                  loader.options = {
                    ...loader.options,
                    implementation: require('sass'),
                    api: 'modern'
                  }
                }
              })
            }
          })
        }
      }
    })
  })

