const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const { AngularCompilerPlugin } = require('@ngtools/webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { CleanCssWebpackPlugin } = require('@angular-devkit/build-angular/src/angular-cli-files/plugins/cleancss-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const helpers = require('./helpers');
const commonConfig = require('./webpack.common.js');

module.exports = webpackMerge(commonConfig, {

    mode: "production",

    devtool: 'source-map',

    output: {
        path: helpers.root('../docs/demo'),
        filename: '[name].[hash].js',
    },

    module: {
        rules: [
            // 减小bundle文件大小
            {
                test: /\.js$/,
                loader: '@angular-devkit/build-optimizer/webpack-loader',
                options: { sourceMap: true }
            },
            {
                test: /\.js$/,
                exclude: /(ngfactory|ngstyle).js$/,
                enforce: 'pre',
                loader: 'source-map-loader'
            }
        ]
    },

    optimization: {
        noEmitOnErrors: true,
        minimizer: [
            new webpack.HashedModuleIdsPlugin(),
            new UglifyJSPlugin({
                sourceMap: true,
                cache: true,
                parallel: true,
                uglifyOptions: {
                    output: {
                        comments: false
                    },
                    compress: {
                        pure_getters: true,
                        passes: 3,
                        inline: 3,
                        // fix bug - ngDevMode is not defined
                        global_defs: require('@angular/compiler-cli').GLOBAL_DEFS_FOR_TERSER
                    }
                }
            }),
            new CleanCssWebpackPlugin({
                sourceMap: true,
                test: (file) => /\.(?:css)$/.test(file),
            })
        ]
    },

    plugins: [
        new AngularCompilerPlugin({
            mainPath: './main.ts',
            tsConfigPath: './demo/tsconfig-demo.json',
            sourceMap: true,
            nameLazyFiles: false,
            skipCodeGeneration: false
        }),
        new CleanWebpackPlugin(),
        new webpack.DefinePlugin({ 'process.env.PRODUCTION': true })
    ]
});