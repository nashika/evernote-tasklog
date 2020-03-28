import path = require("path");
import log4js = require("log4js");

import {configLoader} from "../common/util/config-loader";

log4js.configure(<any>{
  appenders: {
    system: {
      category: "system",
      type: "dateFile",
      filename: path.join(__dirname, "../../logs/system"),
      pattern: "-yyyyMMdd.log",
      backups: 365,
      alwaysIncludePattern: true,
    },
    access: {
      category: "access",
      type: "dateFile",
      filename: path.join(__dirname, "../../logs/access"),
      pattern: "-yyyyMMdd.log",
      backups: 365,
      alwaysIncludePattern: true,
    },
    out: {
      "type": "stdout",
    },
  },
  categories: {
    default: {
      appenders: ["system", "out"],
      level: configLoader.app.logLevel,
    },
    access: {
      appenders: ["access", "out"],
      level: configLoader.app.logLevel,
    }
  }
});

export var logger = log4js.getLogger();
