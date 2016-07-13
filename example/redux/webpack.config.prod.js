/* eslint-disable no-var */
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var axis = require('axis');
var rupture = require('rupture');
var execSync = require('child_process').execSync;
var ReactStaticPlugin = require('../../dist');

module.exports = {
  devtool: 'source-map',

  entry: {
    app: [
      'babel-polyfill',
      './client/index.js',
    ],
  },

  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].js',
    publicPath: '/',
  },

  plugins: [
    new ExtractTextPlugin('[name].css', { allChunks: true }),
    // new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
        __VERSION__: JSON.stringify(execSync('git describe', { encoding: 'utf-8' }).trim()),
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      screw_ie8: true,
      compressor: { warnings: false },
    }),

    // Generate the static site
    new ReactStaticPlugin({
      routes: './client/routes.js',
      reduxStore: './client/redux/store.js',
      template: './template.js',
    }),
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: path.join(__dirname, 'node_modules'),
      },
      {
        test: /\.json$/,
        loaders: ['json'],
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css'),
      },
      {
        test: /\.styl/,
        loader: ExtractTextPlugin.extract('style', 'css?modules&importLoaders=2!autoprefixer!stylus'),
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loaders: ['url?limit=10000&mimetype=application/font-woff'],
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loaders: ['file'],
      },
      {
        test: /\.(png|jpg|gif|ico)$/,
        loaders: ['file?name=[name].[ext]'],
      },
    ],
  },

  stylus: {
    use: [axis(), rupture()],
  },
};
