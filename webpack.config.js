const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const webpack = require('webpack')

module.exports = (env) => {
  const mode = (env && env.production) ? 'production' : 'development'
  return [
    {
      mode: mode,
      entry: './src/js/common.js',
      output: {
        path: `${__dirname}/kskp/static/js`,
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
      // メインとなるJavaScriptファイル（エントリーポイント）
      entry: './src/js/index.js',
      output: {
        path: `${__dirname}/kskp/static/js`,
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
            test: /\.tsx?$/,
            use: ['babel-loader','ts-loader'],
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
        alias: {
          FlowEditorContainer: path.resolve(__dirname, './src/js/components/FlowEditorContainer/'),
          FLowListContainer: path.resolve(__dirname, './src/js/components/FlowListContainer/'),
          LibraryListContainer: path.resolve(__dirname, './src/js/components/LibraryListContainer/'),
          ProfileContainer: path.resolve(__dirname, './src/js/components/ProfileContainer/'),
          ProjectListContainer: path.resolve(__dirname, './src/js/components/ProjectListContainer/'),
          Shared: path.resolve(__dirname, './src/js/components/shared/'),
          Constants: path.resolve(__dirname, './src/js/constants/'),
          Model: path.resolve(__dirname, './src/js/model/'),
          Modules: path.resolve(__dirname, './src/js/modules/'),
          Schema: path.resolve(__dirname, './src/js/schema/'),
          Types: path.resolve(__dirname, './src/js/types/'),
          Utils: path.resolve(__dirname, './src/js/utils/')
        },
        modules: ['node_modules'],
        extensions: ['.js', '.jsx','.ts','.tsx'],
      },
      plugins: [
        new webpack.DllReferencePlugin({
          context: __dirname,
          /**
           * manifestファイルをロードして渡す
           */
          manifest: require(`./kskp/static/js/dist/vendor-manifest.json`),
        }),
      ],
      performance: {hints: false}
    },
    {
      mode: mode,
      entry: './src/sass/app.scss',
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