import webpack = require("webpack");
let UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

let webpackConfig:webpack.Configuration = {
  entry: {
    app: "./src/client/app",
  },
  output: {
    path: "/public/dist",
    publicPath: "/dist/",
    filename: "[name].bundle.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      vue: 'vue/dist/vue.js'
    },
  },
  module: {
    loaders: [
      {test: /\.ts$/, loader: "awesome-typescript-loader", exclude: /node_modules/},
      {test: /\.html$/, loader: "html-loader"},
      {test: /\.jade$/, loaders: ["raw-loader", "jade-html-loader"]},
      {test: /\.css$/, loaders: ["style-loader", "css-loader"]},
      {test: /\.scss$/, loaders: ["style-loader", "css-loader", "sass-loader"]},
      {test: /\.(jpg|jpeg|png|gif)$/, loader: "url-loader"},
      {test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader", query: {prefix: "dist/fonts/", name:"fonts/[name].[ext]", limit: 10000, mimetype: "application/font-woff"}},
      {test: /\.(ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader", query: {name: "fonts/[name].[ext]"}},
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
    host: "localhost",
    port: 8080,
    //hot: true,
    historyApiFallback: true,
    inline: true,
    open: true,
    proxy: {
      "**": {
        target: "http://localhost:3000",
        secure: false,
      },
    },
  },
};

export = webpackConfig;
