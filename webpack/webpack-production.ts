import * as webpack from "webpack";

export function prodPartial(): webpack.Configuration {
  return {
    optimization: {
      minimize: true,
    },
  };
}
