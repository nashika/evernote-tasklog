import webpack = require("webpack");
let UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

let webpackConfig:webpack.Configuration = {
  entry: {
    app: "./src/client/app",
  },
  output: {
    path: "./public/dist",
    publicPath: "/dist/",
    filename: "[name].bundle.js",
  },
  resolve: {
    extensions: ["", ".ts", ".js"],
  },
  module: {
    loaders: [
      {test: /\.ts$/, loader: "ts", exclude: /node_modules/,},
      {test: /\.html$/, loader: "html", },
      {test: /\.jade$/, loaders: ["raw", "jade-html"], },
      {test: /\.css$/, loaders: ["style", "css"], },
      {test: /\.scss$/, loaders: ["style", "css", "sass"], },
      {test: /\.(jpg|jpeg|png|gif)$/, loader: "url"},
      {test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/, loader: "url", query: {prefix: "dist/fonts/", name:"fonts/[name].[ext]", limit: 10000, mimetype: "application/font-woff"}},
      {test: /\.(ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/, loader: "file", query: {name: "fonts/[name].[ext]"}},
    ],
  },
  node: {
    fs: "empty",
  },
  plugins: process.env.NODE_ENV == "production" ? [new UglifyJsPlugin({
    compress: {
      warnings: false,
    },
    mangle: {
      keep_fnames: true,
    }}),
  ] : [],
  devtool: "source-map",
  devServer: {
    contentBase: "./public",
    publicPath: "/dist/",
    host: "0.0.0.0",
    port: 8080,
    //hot: true,
    historyApiFallback: true,
    inline: true,
    proxy: {
      "**": {
        target: "http://localhost:3000",
        secure: false,
      },
    },
  },
};

export = webpackConfig;
