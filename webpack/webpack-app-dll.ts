import * as webpack from "webpack";

import {root} from "./webpack-helpers";

export function appDllPartial(): webpack.Configuration {
  return {
    devtool: "source-map",
    entry: {
      app: ["./src/client/vendor.ts"],
    },
    output: {
      path: root("./dist/js-vendor"),
      filename: "[name]-vendor.bundle.js",
      library: "[name]_lib",
    },
    resolve: {
      alias: {
        vis: "vis/dist/vis-timeline-graph2d.min.js",
        vue: "vue/dist/vue.js",
      },
    },
    node: {
      fs: "empty",
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.ProgressPlugin(),
      new webpack.DllPlugin({
        path: root("./dist/js-vendor/[name]-vendor-manifest.json"),
        name: "[name]_lib",
      }),
    ],
  };
}
