import "reflect-metadata";
import { container } from "~/inversify.config";
import { MainService } from "~/server/service/main.service";
import { logger } from "~/server/logger";

const express = require("express");
const consola = require("consola");
const { Nuxt, Builder } = require("nuxt");
const app = express();

// Import and Set Nuxt.js options
const config = require("../nuxt.config.js");
config.dev = process.env.NODE_ENV !== "production";
console.log("AAA");

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

  // main logic
  const mainService: MainService = container.get<MainService>(MainService);
  try {
    await mainService.initialize(server);
    logger.info(`Initialize web server finished.`);
    logger.info(`Server address is http://localhost:${port}/`);
  } catch (err) {
    logger.error(`Initialize web server failed. err=${err}`);
    if (err.stack) logger.error(err.stack);
  }
}
start();
console.log("AAA");
