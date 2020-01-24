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
        path: `${__dirname}/web/frontend/static/js`,
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
      entry: ['babel-polyfill','./web/frontend/js/index.tsx'],
      output: {
        path: `${__dirname}/web/frontend/static/js`,
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
            use: [{loader: 'style-loader'}, {
              loader: 'css-loader?modules',
              options: {
                localsConvention: 'camelCase'
              }  
            }, {loader: 'sass-loader'}],
            exclude: /node_modules/,
          }
        ],
      },
      resolve: {
        alias: {
          Components: path.resolve(__dirname, './web/frontend/js/components/'),
          FlowEditorContainer: path.resolve(__dirname, './web/frontend/js/components/FlowEditorContainer/'),
          FlowListContainer: path.resolve(__dirname, './web/frontend/js/components/FlowListContainer/'),
          LibraryListContainer: path.resolve(__dirname, './web/frontend/js/components/LibraryListContainer/'),
          ProfileContainer: path.resolve(__dirname, './web/frontend/js/components/ProfileContainer/'),
          ProjectListContainer: path.resolve(__dirname, './web/frontend/js/components/ProjectListContainer/'),
          Shared: path.resolve(__dirname, './web/frontend/js/components/shared/'),
          Constants: path.resolve(__dirname, './web/frontend/js/constants/'),
          Model: path.resolve(__dirname, './web/frontend/js/model/'),
          Modules: path.resolve(__dirname, './web/frontend/js/modules/'),
          Schema: path.resolve(__dirname, './web/frontend/js/schema/'),
          Types: path.resolve(__dirname, './web/frontend/js/types/'),
          Utils: path.resolve(__dirname, './web/frontend/js/utils/')
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
          manifest: require(`./web/frontend/static/js/dist/vendor-manifest.json`),
        }),
      ],
      performance: {hints: false}
    },
    {
      mode: mode,
      entry: './web/frontend/sass/app.scss',
      output: {
        path: `${__dirname}/web/frontend/static/css`,
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