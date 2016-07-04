/* eslint-disable no-var */
var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var ReactStaticPlugin = require('../../dist');

module.exports = {
  devtool: 'source-map',

  entry: {
    app: ['./client/index.js'],
  },

  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].js',
    publicPath: '/',
  },

  plugins: [
    // new webpack.optimize.OccurenceOrderPlugin(),
    // new webpack.DefinePlugin({
    //   'process.env': {
    //     'NODE_ENV': JSON.stringify('production'),
    //   },
    // }),
    // new webpack.optimize.UglifyJsPlugin({
    //   screw_ie8: true,
    //   compressor: { warnings: false },
    // }),
    new ReactStaticPlugin({
      routes: './client/components/App.js',
      stylesheet: '/app.css',
    }),
    new ExtractTextPlugin('style.css', { allChunks: true }),
  ],

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'client'),
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style', 'css'),
      },
      // {
      //   test: /\.styl/,
      //   loader: ExtractTextPlugin.extract('style', 'css?modules&importLoaders=2!autoprefixer!stylus'),
      // },
      // {
      //   test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      //   loaders: ['url?limit=10000&mimetype=application/font-woff'],
      // },
      // {
      //   test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      //   loaders: ['file'],
      // },
      // {
      //   test: /\.(png|jpg|gif|ico)$/,
      //   loaders: ['file?name=[name].[ext]'],
      // },
    ],
  },

};
