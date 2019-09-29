const testWebpackConfig = require('./webpack.test.js');

module.exports = config => {

    config.set({

        basePath: '',

        frameworks: [ 'jasmine' ],

        plugins: [
            require('karma-jasmine'),
            require('karma-webpack'),
            require('karma-chrome-launcher'),
            require('karma-sourcemap-loader'),
            require('karma-spec-reporter')
        ],

        files: [
            { pattern: 'karma.bundle.js', watched: false }
        ],

        preprocessors: {
            'karma.bundle.js': [ 'webpack' ]
        },

        webpack: testWebpackConfig,

        port: 9876,
        colors: true,
        reporters: [ 'spec' ],
        browsers: [ 'Chrome' ],
        autoWatch: true,
        singleRun: true,

        browserConsoleLogOptions: {
            terminal: true,
            level: 'log'
        }
    });

};
