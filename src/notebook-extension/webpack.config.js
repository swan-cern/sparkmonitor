/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

const config = {
    mode: 'production',
    entry: {
        extension: path.join(__dirname, 'index.ts'),
    },
    output: {
        path: path.join(__dirname, '../../sparkmonitor/static'),
        filename: '[name].js',
        libraryTarget: 'umd',
    },
    externals: ['require', 'base/js/namespace', 'base/js/events', 'notebook/js/codecell'],
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-typescript', '@babel/preset-react'],

                        plugins: ['add-module-exports'],
                    },
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader'],
            },
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        attrs: [':data-src'],
                    },
                },
            },
            {
                test: /node_modules[\\\/]vis[\\\/].*\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: ['@babel/preset-env'],
                        babelrc: false,
                    },
                },
            },
        ],
    },
};

module.exports = config;