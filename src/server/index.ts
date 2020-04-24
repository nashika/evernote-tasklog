import "reflect-metadata";
import express from "express";
import consola from "consola";
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
  // Init Nuxt.js
  const nuxt = new Nuxt(config);

  const { host, port } = nuxt.options.server;

  await nuxt.ready();
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt);
    await builder.build();
  }

  // Give nuxt middleware to express
  app.use(nuxt.render);

  // Listen the server
  const server = app.listen(port, host);
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true,
  });

  try {
    // サービスの起動処理
    const mainService = container.get(MainService);
    await mainService.initialize(app, server);
    logger.info(`Webサーバのアドレスは http://localhost:${port}/`);
  } catch (err) {
    logger.error(`Webサーバの起動に失敗しました. err=${err}`);
    if (err.stack) logger.error(err.stack);
  }
}
start();
