import * as webpack from "webpack";

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
        vue: "vue/dist/vue.js",
      },
    },
    module: {
      loaders: [
        {test: /\.ts$/, loader: "awesome-typescript-loader", exclude: /node_modules/},
        {test: /\.vue$/, loader: "vue-loader", options: {
          loaders: {
            ts: "awesome-typescript-loader",
            pug: "pug-html-loader",
            scss: "style-loader!css-loader!sass-loader",
          }
        }},
      ],
    },
    devtool: "source-map",
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.ProgressPlugin(),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        "config.loader.app": JSON.stringify(configLoader.app),
      }),
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
      proxy: {
        "**": {
          target: "http://localhost:3000",
          secure: false,
        },
      },
    },
  };
}
