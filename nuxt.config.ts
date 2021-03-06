import { NuxtConfig } from "@nuxt/types";
import webpack from "webpack";

import { icons } from "./src/client/icons";

const webpackConfig: webpack.Configuration = {
  /*
   ** You can extend webpack config here
   */
  // extend(config: any, ctx: any) {}
  plugins: [
    // Ignore all locale files of moment.js
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
};

const conf: NuxtConfig = {
  ssr: false,
  dir: {
    assets: "src/client/assets",
    layouts: "src/client/layouts",
    middleware: "src/client/middleware",
    pages: "src/client/pages",
    static: "src/client/static",
    store: "src/client/store",
  },
  /*
   ** Headers of the page
   */
  head: {
    title: process.env.npm_package_name || "",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        hid: "description",
        name: "description",
        content: process.env.npm_package_description || "",
      },
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: "#fff" },
  /*
   ** Global CSS
   */
  css: ["~/src/client/scss/style.scss"],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    "~/src/client/plugins/vendor",
    "~/src/client/plugins/logger",
    "~/src/client/plugins/filter",
    "~/src/client/plugins/service",
    "~/src/client/plugins/my-store",
  ],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    "@nuxt/typescript-build",
    // Doc: https://github.com/nuxt-community/eslint-module
    "@nuxtjs/eslint-module",
    // Doc: https://github.com/nuxt-community/stylelint-module
    "@nuxtjs/stylelint-module",
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://bootstrap-vue.js.org
    ["bootstrap-vue/nuxt", { css: false }],
    "@nuxtjs/fontawesome",
  ],
  /*
   ** Axios module configuration
   ** See https://axios.nuxtjs.org/options
   */
  axios: {},
  fontawesome: {
    component: "fa",
    icons,
  },
  /*
   ** Build configuration
   */
  build: <any>{
    babel: {
      compact: false,
    },
    ...webpackConfig,
  },
  telemetry: true,
};
export default conf;
