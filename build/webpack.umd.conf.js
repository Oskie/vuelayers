// This the Webpack config for building UMD lib
const path = require('path')
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

const apart = process.argv.includes('--apart')
const isProduction = process.env.NODE_ENV === 'production'
const minify = isProduction && process.argv.includes('--min')
const env = isProduction ? config.build.env : config.dev.env

// bundle all-in-one by default
let output = {
  filename: minify ? '[name].bundle.min.js' : '[name].bundle.js',
  library: config.fullname,
  libraryTarget: 'umd'
}

// bundle each component as individual UMD module
// todo сделать экспорт компонентов в структуру подходящую для babel-plugin-component
// todo всё таки надо две отдельные фазы билда: всё в одном файле (компоненты + утилиты + миксины)
// и отдельная фаза билда по компонентам (утилиты и миксины в отдельных файлах)

if (apart) {
  baseWebpackConfig.entry = {

  }
  output.filename = minify ? '[name].min.js' : '[name].js'
  output.library = [ config.fullname, '[name]' ]

  const componentsPath = 'src/components'
  const components = utils.getDirectories(path.resolve(__dirname, '../', componentsPath))
  components.forEach(component => {
    baseWebpackConfig.entry[ path.join(component, 'index') ] = path.resolve(__dirname, '../', componentsPath, component)
  })
}

const webpackConfig = merge(baseWebpackConfig, {
  output: output,
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true,
      minimize: minify
    })
  },
  externals: [
    nodeExternals()
  ],
  devtool: config.build.productionSourceMap ? '#source-map' : false,
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      'process.env': env
    }),
    ...(
      minify
        ? [
          new webpack.optimize.UglifyJsPlugin({
            comments: false,
            compress: { warnings: false },
            mangle: true,
            sourceMap: true
          })
        ]
        : []
    ),
    // extract css into its own file
    new ExtractTextPlugin({
      filename: minify ? '[name].min.css' : '[name].css'
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin(),
    new webpack.BannerPlugin(config.banner)
  ]
})

if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig