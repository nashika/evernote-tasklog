import logLevel from "loglevel";
import { appConfigLoader } from "~/src/common/util/app-config-loader";

export const clientLogger = logLevel.getLogger("evernote-tasklog");

clientLogger.setLevel(appConfigLoader.app.logLevel);
