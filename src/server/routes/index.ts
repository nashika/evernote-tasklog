import express = require("express");
import {Express} from "express";

import {IndexRoute} from "./index-route";
import {NotebookRoute} from "./notebook-route";
import {NoteRoute} from "./note-route";
import {ProfitLogRoute} from "./profit-log-route";
import {SettingRoute} from "./setting-route";
import {UserRoute} from "./user-route";
import {TimeLogRoute} from "./time-log-route";
import {SyncRoute} from "./sync-route";
import {AuthRoute} from "./auth-route";
import {kernel} from "../inversify.config";

export function routes(app:Express) {

  let indexRoute = new IndexRoute();
  let authRoute = kernel.get<AuthRoute>(AuthRoute);
  let noteRoute = new NoteRoute();
  let notebookRoute = new NotebookRoute();
  let settingRoute = new SettingRoute();
  let syncRoute = new SyncRoute();
  let timeLogRoute = new TimeLogRoute();
  let profitLogRoute = new ProfitLogRoute();
  let userRoute = new UserRoute();

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
