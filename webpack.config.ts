import * as webpackMerge from "webpack-merge";
import * as webpack from "webpack";

import {appPartial} from "./webpack/webpack-app";
import {appDllPartial} from "./webpack/webpack-app-dll";
import {prodPartial} from "./webpack/webpack-production";

const env: string = process.env.NODE_ENV || "development";
const dll: boolean = !!process.env.WEBPACK_DLL;

let configs: webpack.Configuration[] = [];
if (!dll)
  configs.push(webpackMerge({}, appPartial(), env.match(/^production.*$/) ? prodPartial() : {}));
else
  configs.push(webpackMerge({}, appDllPartial(), prodPartial()));

export default configs;
