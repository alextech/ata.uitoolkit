const path = require( 'path' );

const mode = 'production';

process.env.NODE_ENV = mode;
process.env.BABEL_ENV = mode;

module.exports = {
    entry: './src/index.js',
    mode: mode,
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'ata-uitoolkit.js',
        library: {
            name: "ata_uitoolkit",
            type: "umd"
        },
    },
    module: {
        rules: [
            {
                test: /\.scss$/, use: [
                    {
                        loader: 'constructable-style-loader',
                        options: {
                            purge: false,
                            content: [],
                        }
                    },
                    'postcss-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: require('sass')
                        }
                    }
                ]
            }
        ]
    }
};