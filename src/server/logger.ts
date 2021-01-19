import * as path from "path";
import * as log4js from "log4js";

import { appConfigLoader } from "~/src/common/util/app-config-loader";

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
      type: "stdout",
    },
  },
  categories: {
    default: {
      appenders: ["system", "out"],
      level: appConfigLoader.app.logLevel,
    },
    access: {
      appenders: ["access", "out"],
      level: appConfigLoader.app.logLevel,
    },
  },
});

export const logger = log4js.getLogger();
