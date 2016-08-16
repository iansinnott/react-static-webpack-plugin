/* eslint-disable no-var */
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var axis = require('axis');
var rupture = require('rupture');
var ReactStaticPlugin = require('../../dist');

module.exports = {
  entry: {
    app: ['./src/index.js'],
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
      stylesheet: '/app.css',
      template: './template.js'
    }),
    new ExtractTextPlugin('[name].css', { allChunks: true }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      screw_ie8: true,
      compressor: { warnings: false },
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
