const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js', // Output bundle 
    path: path.resolve(__dirname, 'dist'),
    sourceMapFilename: 'bundle.js.map',
  },
  mode: 'development', // Set mode to 'production' or 'development'
  module: {
      rules: [
        //// Rule for JavaScript files (use babel-loader for transpilation if needed)
        // {
        //   test: /\.js$/,
        //   exclude: /node_modules/,
        //   use: {
        //     loader: 'babel-loader', // If using Babel for transpilation
        //     options: {
        //       presets: ['@babel/preset-env']
        //     }
        //   }
        // },
        //// Rule for CSS files (for SimpleMDE styles)
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
      ],
  },
  resolve: {
    alias: {

    }
  }
};