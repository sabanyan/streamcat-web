const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');

module.exports = [
  {
    // モード値を production に設定すると最適化された状態で、
    // development に設定するとソースマップ有効でJSファイルが出力される
    mode: 'development',

    // メインとなるJavaScriptファイル（エントリーポイント）
    entry: './src/js/index.js',
    output: {
      path: `${__dirname}/kskp/static/js`,
      filename: 'app.js'
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
          use: ['style-loader', 'css-loader?modules','sass-loader'],
          exclude: /node_modules/,
        }
      ]
    },
    resolve: {
      modules: ['node_modules'],
      extensions: ['.js','.jsx']
    },
    plugins: [
      new webpack.DllReferencePlugin({
        context: __dirname,
        /**
         * manifestファイルをロードして渡す
         */
        manifest: require(`./kskp/static/js/dist/vendor-manifest.json`)
      })
    ]
  },
  {
    entry: "./src/sass/app.scss",
    output: {
      path: `${__dirname}/kskp/static/css`,
      filename: 'app.css'
    },
    module: {
      rules: [{
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        }),
        exclude: /node_modules/,
      }]
    },
    plugins: [
      new ExtractTextPlugin('app.css'),
    ],
  },
];
