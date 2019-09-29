module.exports = {

    mode: "development",

    devtool: 'inline-source-map',

    performance: {
        hints: false
    },

    resolve: {
        extensions: [ '.ts', '.js' ]
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    'ts-loader',
                    'angular-router-loader',
                    'angular2-template-loader'
                ]
            },
            {
                test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
                parser: { system: true },
            }
        ]
    }
};

