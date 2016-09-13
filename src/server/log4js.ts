import path = require("path");
import log4js = require("log4js");

log4js.configure({
  appenders: [
    {
      category: "system",
      type: "dateFile",
      filename: path.join(__dirname, "../../logs/system"),
      pattern: "-yyyyMMdd.log",
      backups: 365,
      alwaysIncludePattern: true,
    },
    {
      category: "access",
      type: "dateFile",
      filename: path.join(__dirname, "../../logs/access"),
      pattern: "-yyyyMMdd.log",
      backups: 365,
      alwaysIncludePattern: true,
    },
    {
      "type": "console"
    },
  ],
  levels: {
    "system": "TRACE"
  },
});
