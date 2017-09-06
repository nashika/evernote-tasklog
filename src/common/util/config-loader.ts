import * as _ from "lodash";

import appConfig from "../../../config/app.config";

class ConfigLoader {

  private caches: {[configName: string]: any};

  constructor() {
    this.caches = {};
  }

  get app(): config.IAppConfig {
    return this.load("app", appConfig);
  }

  private load(configName: string, config: any): any {
    if (!this.caches[configName]) {
      let targetEnvName: string = process.env.NODE_ENV || "development";
      if (!config[targetEnvName])
        throw new Error(`/config/${configName}.config.ts has no "${targetEnvName}" setting.`);
      let targetEnvConfig: Object = {};
      for (let envName in config) {
        let envConfig = config[envName];
        if (new RegExp("^" + envName.replace("*", ".*") + "$").test(targetEnvName))
          _.merge(targetEnvConfig, envConfig);
      }
      this.caches[configName] = targetEnvConfig;
    }
    return this.caches[configName];
  }

}

export var configLoader = new ConfigLoader();
