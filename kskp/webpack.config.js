const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

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
            use: [
              {
                // Babel を利用する
                loader: "babel-loader",
                // Babel のオプションを指定する
                options: {
                  presets: [
                    // プリセットを指定することで、ES2020 を ES5 に変換
                    "@babel/preset-env",
                  ],
                },
              },
            ],
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        modules: ['node_modules'],
        extensions: ['.js'],
      },
      stats: {
        errorDetails: true
      }
    }
    ,
    {
      mode: mode,
      entry: ['babel-polyfill', './web/frontend/js/index.tsx'],
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
            use: ['babel-loader', 'ts-loader'],
            exclude: /node_modules/,
          },
          {
            test: /\.s?css$/,
            use: ['style-loader', 'css-loader?modules', 'sass-loader'],
            exclude: /node_modules/,
          },
        ]
      },
      resolve: {
        alias: {
          Components: path.resolve(__dirname, './web/frontend/js/components/'),
          FlowEditorContainer: path.resolve(__dirname, './web/frontend/js/components/FlowEditorContainer/'),
          FlowListContainer: path.resolve(__dirname, './web/frontend/js/components/FlowListContainer/'),
          LibraryContainer: path.resolve(__dirname, './web/frontend/js/components/LibraryContainer/'),
          ProfileContainer: path.resolve(__dirname, './web/frontend/js/components/ProfileContainer/'),
          ProjectListContainer: path.resolve(__dirname, './web/frontend/js/components/ProjectListContainer/'),
          PreviewContainer: path.resolve(__dirname, './web/frontend/js/components/PreviewContainer/'),
          UserListContainer: path.resolve(__dirname, './web/frontend/js/components/admin/UserListContainer/'),
          Shared: path.resolve(__dirname, './web/frontend/js/components/shared/'),
          Constants: path.resolve(__dirname, './web/frontend/js/constants/'),
          Model: path.resolve(__dirname, './web/frontend/js/model/'),
          Modules: path.resolve(__dirname, './web/frontend/js/modules/'),
          Schema: path.resolve(__dirname, './web/frontend/js/schema/'),
          Types: path.resolve(__dirname, './web/frontend/js/types/'),
          Utils: path.resolve(__dirname, './web/frontend/js/utils/'),
          Features: path.resolve(__dirname, './web/frontend/js/features/'),
        },
        modules: ['node_modules'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
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
      performance: { hints: false },
      stats: {
        errorDetails: true
      }
    }
    ,
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
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader',
              'sass-loader'
            ],
            exclude: /node_modules/,
          }],
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: '[name].css',
          chunkFilename: '[id].css'
        }),
      ],
      stats: {
        errorDetails: true
      }
    }
  ]
};