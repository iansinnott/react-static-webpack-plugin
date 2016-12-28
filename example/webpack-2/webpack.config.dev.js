const path = require('path');
const webpack = require('webpack');
const rupture = require('rupture');
const autoprefixer = require('autoprefixer');

// Set up dev host host and HMR host. For the dev host this is pretty self
// explanatory: We use a different live-reload server to server our static JS
// files in dev, so we need to be able to actually point a script tag to that
// host so it can load the right files. The HRM host is a bit stranger. For more
// details on why we need this URL see the readme and:
// https://github.com/glenjamin/webpack-hot-middleware/issues/37
const DEV_PORT = process.env.DEV_PORT || 3000;
const DEV_HOST = '//localhost:' + DEV_PORT + '/';
const HMR_HOST = DEV_HOST + '__webpack_hmr';

module.exports = {
  devtool: 'inline-source-map',

  entry: {
    app: [
      'normalize.css',
      'webpack-hot-middleware/client?path=' + HMR_HOST,
      './client/index.js',
    ],
  },

  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].js',
    publicPath: DEV_HOST,
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: [autoprefixer({ browsers: ['last 2 versions'] })],
        stylus: {
          use: [rupture()],
        },
      },
    }),
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'client'),
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
      {
        test: /\.styl$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              module: true,
              importLoaders: 2,
              localIdentName: '[name]__[local]__[hash:base64:6]',
            },
          },
          { loader: 'postcss-loader' },
          {
            loader: 'stylus-loader',
          },
        ],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          {
            loader: 'url-loader',
            options: { limit: 10000, mimetype: 'mimetype=application/font-woff' },
          },
        ],
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
      },
      {
        test: /\.(png|jpg|gif|ico)$/,
        use: [
          { loader: 'file-loader', options: { name: '[name].[ext]' } },
        ],
      },
    ],
  },
};
