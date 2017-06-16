import * as fs from "fs";
import * as path from "path";

import * as _ from "lodash";

declare namespace config {
  namespace loader {
    var app: IAppConfig;
  }
}

export interface IAppConfig {
  port: string;
  logLevel: string;
}

class ConfigLoader {

  public isBrowser: boolean = false;

  private caches: {[configName: string]: any};

  constructor() {
    this.caches = {};
  }

  get app(): IAppConfig {
    return this.load("app");
  }

  private load(configName: string): any {
    if (!this.caches[configName]) {
      let jsonData: any;
      if (this.isBrowser) {
        this.caches["app"] = config.loader.app;
      } else {
        try {
          jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, `../../../config/${configName}.config.json`), "utf8"));
        } catch (err) {
          throw new Error(`/config/${configName}.config.json ファイルの読込に失敗しました`);
        }
        let env = process.env.NODE_ENV || "development";
        if (!jsonData[env])
          throw new Error(`/config/${configName}.config.json に ${env} の環境に対する定義が記述されていません`);
        let targetConfig = jsonData[env];
        let allConfig = jsonData["all"] || {};
        this.caches[configName] = _.defaults(targetConfig, allConfig);
      }
    }
    return this.caches[configName];
  }

}

export var configLoader = new ConfigLoader();
