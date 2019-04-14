const path = require('path');
const webpack = require("webpack");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const package = require('./package.json');

module.exports = {
    mode: 'production',
    // target: "node",
    // externals: [nodeExternals()],
    entry: {
        simpleBitcoinWallet: './src/lib/SimpleBitcoinWallet.ts',
        simpleBitcoinDatabase: './src/lib/SimpleBitcoinDatabase.ts',
        bitboxlight: './src/lib/bitboxlight.ts',
        simplewallet: './src/index.ts',
    },
    output: {
        filename: '[name].min.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: "umd"
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true
                    }
                }],
            }, {
                test: /\.js$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true
                    }
                }],
            },
        ],
    },
    externals: {},
    resolve: {
        extensions: [ '*', '.ts', '.js', '.css' ]
    },
    plugins: [
      new webpack.ProvidePlugin({
        CryptoJS: 'crypto-js'
      })
    ],
    optimization: {
        minimizer: [new UglifyJsPlugin({
            uglifyOptions: {
                mangle: {
                    // safari10: true,
                    keep_fnames: true,
                    reserved: [ "BigInteger", "ECPair", "Point"],
                }
            },
            extractComments: {
                condition: 'all',
                banner: `${package.name} v${package.version}. 2018-2019 Copyright Adrian Barwicki adrian@adrianbarwicki.com`
            }
        })]
    },
};
