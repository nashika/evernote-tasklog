import express = require("express");
import {Express} from "express";

import {AuthRoute} from "./auth-route";
import {IndexRoute} from "./index-route";
import {NotebooksRoute} from "./notebooks-route";
import {NotesRoute} from "./notes-route";
import {ProfitLogsRoute} from "./profit-logs-route";
import {SettingsRoute} from "./settings-route";
import {UserRoute} from "./user-route";
import {TimeLogsRoute} from "./time-logs-route";
import {SyncRoute} from "./sync-route";

export function routes(app:Express) {

  let indexRoute = new IndexRoute(app);
  let authRoute = new AuthRoute(app);
  let notesRoute = new NotesRoute(app);
  let notebooksRoute = new NotebooksRoute(app);
  let settingsRoute = new SettingsRoute(app);
  let syncRoute = new SyncRoute(app);
  let timeLogsRoute = new TimeLogsRoute(app);
  let profitLogsRoute = new ProfitLogsRoute(app);
  let userRoute = new UserRoute(app);

  app.use("/", indexRoute.getRouter());
  app.use("/auth", authRoute.getRouter());
  app.use("/notes", notesRoute.getRouter());
  app.use("/notebooks", notebooksRoute.getRouter());
  app.use("/settings", settingsRoute.getRouter());
  app.use("/sync", syncRoute.getRouter());
  app.use("/time-logs", timeLogsRoute.getRouter());
  app.use("/profit-logs", profitLogsRoute.getRouter());
  app.use("/user", userRoute.getRouter());

}
