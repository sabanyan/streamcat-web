const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');

module.exports = [
  {
    mode: 'development',
    //ref:https://qiita.com/pirosikick/items/c77db84dbed4c447a6fe
    entry: {
      vendor: ['react','react-dom','react-redux','classnames','dagre','react-chartjs-2','eventemitter3','moment']
    },
    output: {
      path: `${__dirname}/kskp/static/js`,
      filename: '[name].js',
      /**
       * output.library
       * window.${output.library}に定義される
       * 今回の場合、`window.vendor_library`になる
       */
      library: '[name]_library'
    },
    plugins: [
      new webpack.DllPlugin({
        /**
         * path
         * manifestファイルの出力先
         * [name]の部分はentryの名前に変換される
         */
        path: path.join(__dirname, '/kskp/static/js/dist', '[name]-manifest.json'),
        /**
         * name
         * どの空間（global変数）にdll bundleがあるか
         * output.libraryに指定した値を使えばよい
         */
        name: '[name]_library'
      })
    ]
  }
];
