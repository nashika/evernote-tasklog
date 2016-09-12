import express = require("express");
import {Express} from "express";

import {AuthRoute} from "./auth-route";
import {IndexRoute} from "./index-route";
import {NotebookRoute} from "./notebook-route";
import {NoteRoute} from "./note-route";
import {ProfitLogRoute} from "./profit-log-route";
import {SettingRoute} from "./setting-route";
import {UserRoute} from "./user-route";
import {TimeLogRoute} from "./time-log-route";
import {SyncRoute} from "./sync-route";

export function routes(app:Express) {

  let indexRoute = new IndexRoute(app);
  let authRoute = new AuthRoute(app);
  let noteRoute = new NoteRoute(app);
  let notebookRoute = new NotebookRoute(app);
  let settingRoute = new SettingRoute(app);
  let syncRoute = new SyncRoute(app);
  let timeLogRoute = new TimeLogRoute(app);
  let profitLogRoute = new ProfitLogRoute(app);
  let userRoute = new UserRoute(app);

  app.use("/", indexRoute.getRouter());
  app.use("/auth", authRoute.getRouter());
  app.use("/note", noteRoute.getRouter());
  app.use("/notebook", notebookRoute.getRouter());
  app.use("/setting", settingRoute.getRouter());
  app.use("/sync", syncRoute.getRouter());
  app.use("/time-log", timeLogRoute.getRouter());
  app.use("/profit-log", profitLogRoute.getRouter());
  app.use("/user", userRoute.getRouter());

}
