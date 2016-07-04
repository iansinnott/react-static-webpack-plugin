/* eslint-disable no-var */
var path = require('path');

var StaticSitePlugin = require('../../dist');

module.exports = {
  devtool: 'source-map',

  entry: {
    app: './src/index.js',
  },

  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].js',
    libraryTarget: 'umd',
    publicPath: '/',
  },

  plugins: [
    new StaticSitePlugin({
      routes: './src/routes.js',
      stylesheet: '/app.css',
      favicon: '/favicon.ico',
    }),
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'src'),
      },
    ],
  },
};
