import * as webpack from "webpack";
import UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

export function prodPartial(): webpack.Configuration {
  return {
    plugins: [
      new UglifyJsPlugin({
        compress: {
          warnings: false,
        },
        mangle: {
          keep_fnames: true,
        },
        sourceMap: true,
      }),
    ],
  };
}
