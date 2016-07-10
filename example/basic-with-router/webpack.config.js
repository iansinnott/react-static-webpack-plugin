/* eslint-disable no-var */
var path = require('path');

var ReactStaticPlugin = require('../../dist');

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
    new ReactStaticPlugin({
      routes: './src/routes.js',
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
    ],
  },
};
