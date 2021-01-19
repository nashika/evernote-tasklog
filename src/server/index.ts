import "reflect-metadata";
import * as https from "https";
import path from "path";
import * as fs from "fs";
import * as http from "http";
import express from "express";
// @ts-ignore
import { Nuxt, Builder } from "nuxt";

// Import and Set Nuxt.js options
import config from "../../nuxt.config";
import "~/src/server/inversify.config";
import { MainService } from "~/src/server/service/main.service";
import { container } from "~/src/common/inversify.config";
import { logger } from "~/src/common/logger";
import { appConfigLoader } from "~/src/common/util/app-config-loader";

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
    let server: http.Server;
    if (appConfigLoader.app.https) {
      const httpsServer = https.createServer(
        {
          key: fs.readFileSync(path.join(__dirname, "ssl/private_key.pem")),
          cert: fs.readFileSync(path.join(__dirname, "ssl/server.crt")),
        },
        app
      );
      server = httpsServer.listen(port);
    } else {
      server = app.listen(port);
    }

    // サービスの起動処理
    const mainService = container.get(MainService);
    await mainService.initialize(app, server);

    // Give nuxt middleware to express
    logger.info(`Webサーバにnuxtミドルウェアを設定します.`);
    app.use(nuxt.render);

    logger.info(
      `Webサーバの起動を完了しました. ${
        appConfigLoader.app.https ? "https" : "http"
      }://${host}:${port}`
    );
  } catch (err) {
    logger.error(`Webサーバの起動に失敗しました. err=${err}`);
    if (err.stack) logger.error(err.stack);
  }
}
start();
