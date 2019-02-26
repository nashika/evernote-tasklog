import * as webpack from "webpack";
import {VueLoaderPlugin} from "vue-loader";

import {root} from "./webpack-helpers";
import {configLoader} from "../src/common/util/config-loader";

export function appPartial(): webpack.Configuration {
  return {
    target: "web",
    entry: {
      app: "./src/client/app",
    },
    output: {
      path: root("./dist/js"),
      publicPath: "/dist/js",
      filename: "[name].bundle.js",
    },
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        vis: "vis/dist/vis-timeline-graph2d.min.js",
      },
    },
    module: {
      rules: [
        {test: /\.ts$/, loader: "ts-loader", exclude: /node_modules/},
        {test: /\.vue$/, loader: "vue-loader"},
        {test: /\.pug$/, loader: "pug-html-loader"},
        {test: /\.scss$/, loader: "style-loader!css-loader!sass-loader"},
      ],
    },
    devtool: "source-map",
    node: {
      fs: "empty",
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.ProgressPlugin(),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        "config.loader.app": JSON.stringify(configLoader.app),
      }),
      new VueLoaderPlugin(),
      new webpack.DllReferencePlugin({
        context: '.',
        manifest: require(root("./dist/js-vendor/app-vendor-manifest.json")),
      }),
    ],
    devServer: {
      contentBase: "./public",
      publicPath: "/dist/js",
      host: "localhost",
      port: 8080,
      //hot: true,
      historyApiFallback: true,
      inline: true,
      open: true,
      openPage: "",
      proxy: {
        "**": {
          target: "http://localhost:3000",
          secure: false,
        },
      },
    },
  };
}
