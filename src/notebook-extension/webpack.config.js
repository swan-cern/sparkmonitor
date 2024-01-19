/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

const config = {
  mode: 'production',
  entry: {
    extension: path.join(__dirname, 'entry.js')
  },
  output: {
    path: path.join(__dirname, '../../sparkmonitor/nbextension'),
    filename: '[name].js',
    libraryTarget: 'umd',
    publicPath: '',
    clean: true
  },
  externals: [
    'require',
    'base/js/namespace',
    'base/js/events',
    'notebook/js/codecell'
  ],
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-typescript',
              '@babel/preset-react'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader']
      },
      {
        test: /\.(html)$/,
        use: {
          loader: 'html-loader',
          options: {
            attrs: [':data-src']
          }
        }
      }
    ]
  }
};

module.exports = config;
