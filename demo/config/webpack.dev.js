const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const { AngularCompilerPlugin } = require('@ngtools/webpack');

const commonConfig = require('./webpack.common.js');

module.exports = webpackMerge(commonConfig, {

    mode: "development",

    devtool: 'eval-map',

    output: {
        filename: '[name].js',
    },

    plugins: [
        new AngularCompilerPlugin({
            mainPath: 'main.ts',
            tsConfigPath: './tsconfig-demo.json',
            sourceMap: true,
            nameLazyFiles: true,
            skipCodeGeneration: true
        }),
        new webpack.DefinePlugin({ 'process.env.PRODUCTION': false })
    ],

    devServer: {
        historyApiFallback: true,
        watchOptions: {
            ignored: [
                'node_modules',
                '**/*.spec.ts'
            ]
        }
    }
});
