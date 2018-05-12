const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = [
  {
    // モード値を production に設定すると最適化された状態で、
    // development に設定するとソースマップ有効でJSファイルが出力される
    mode: 'development',

    // メインとなるJavaScriptファイル（エントリーポイント）
    entry: './src/js/index.js',
    output: {
      filename: '../public/js/app.js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: ['babel-loader'],
          exclude: /node_modules/,
        }
      ]
    },
    resolve: {
      modules: ['node_modules'],
      extensions: ['.js','.jsx']
    },
  },
  // {
  //   entry: [`${__dirname}/node_modules/jquery/dist/jquery.js`,`${__dirname}/node_modules/bootstrap/dist/js/bootstrap.js`],
  //   output: {
  //     path: `${__dirname}/app/static/js`,
  //     filename: 'vendor.js'
  //   }
  // },
  {
    mode: 'development',
    entry: "./src/sass/app.scss",
    output: {
      filename: '../public/css/app.css'
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
      new ExtractTextPlugin('./css/app.css'),
    ],
  },
];
