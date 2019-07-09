const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const webpack = require('webpack')

module.exports = (env) => {
  const mode = (env && env.production) ? 'production' : 'development'
  return [
    {
      mode: mode,
      entry: './web/frontend/js/common.js',
      output: {
        path: `${__dirname}/web/frontend/kskp/static/js`,
        filename: 'common.js',
      },
      module: {
        rules: [
          {
            test: /\.js?$/,
            use: ['babel-loader'],
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        modules: ['node_modules'],
        extensions: ['.js'],
      },
    }
    ,
    {
      // モード値を production に設定すると最適化された状態で、
      // development に設定するとソースマップ有効でJSファイルが出力される
      mode: mode,
      // メインとなるJavaScriptファイル（エントリーポイント）ls
      entry: './web/frontend/js/index.js',
      output: {
        path: `${__dirname}/web/kskp/static/js`,
        filename: 'app.js',
      },
      module: {
        rules: [
          {
            test: /\.jsx?$/,
            use: ['babel-loader'],
            exclude: /node_modules/,
          },
          {
            test: /\.s?css$/,
            use: ['style-loader', 'css-loader?modules', 'sass-loader'],
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        modules: ['node_modules'],
        extensions: ['.js', '.jsx'],
      },
      plugins: [
        new webpack.DllReferencePlugin({
          context: __dirname,
          /**
           * manifestファイルをロードして渡す
           */
          manifest: require(`./web/kskp/static/js/dist/vendor-manifest.json`),
        }),
      ],
      performance: {hints: false}
    },
    {
      mode: mode,
      entry: './web/frontend/sass/app.scss',
      output: {
        path: `${__dirname}/kskp/static/css`,
        filename: 'app.css',
      },
      module: {
        rules: [
          {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use: ['css-loader', 'sass-loader'],
            }),
            exclude: /node_modules/,
          }],
      },
      plugins: [
        new ExtractTextPlugin('app.css'),
      ],
    },
  ]
}