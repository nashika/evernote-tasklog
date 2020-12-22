import "reflect-metadata";
import express from "express";
// @ts-ignore
import { Nuxt, Builder } from "nuxt";

// Import and Set Nuxt.js options
import config from "../../nuxt.config";
import container from "~/src/server/inversify.config";
import MainService from "~/src/server/service/main.service";
import logger from "~/src/server/logger";

const app = express();

config.dev = process.env.NODE_ENV !== "production";

async function start() {
  try {
    // Init Nuxt.js
    const nuxt = new Nuxt(config);

    const { host, port } = nuxt.options.server;

    await nuxt.ready();
    // Build only in dev mode
    if (config.dev) {
      logger.info("nuxtアプリケーションをビルドします.");
      const builder = new Builder(nuxt);
      await builder.build();
    }

    // Listen the server
    logger.info(`Webサーバを起動します.`);
    const server = app.listen(port);

    // サービスの起動処理
    const mainService = container.get(MainService);
    await mainService.initialize(app, server);

    // Give nuxt middleware to express
    logger.info(`Webサーバにnuxtミドルウェアを設定します.`);
    app.use(nuxt.render);

    logger.info(`Webサーバの起動を完了しました. http://${host}:${port}`);
  } catch (err) {
    logger.error(`Webサーバの起動に失敗しました. err=${err}`);
    if (err.stack) logger.error(err.stack);
  }
}
start();
