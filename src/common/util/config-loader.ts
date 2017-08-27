import * as path from "path";

import * as _ from "lodash";

class ConfigLoader {

  public isBrowser: boolean = false;

  private caches: {[configName: string]: any};

  constructor() {
    this.caches = {};
  }

  get app(): config.IAppConfig {
    return this.load("app");
  }

  private load(configName: string): any {
    if (!this.caches[configName]) {
      let jsonData: any;
      if (this.isBrowser) {
        this.caches["app"] = config.loader.app;
      } else {
        try {
          jsonData = require(path.join(__dirname, `../../../config/${configName}.config`)).default;
        } catch (err) {
          throw new Error(`Cannot to read /config/${configName}.config.ts`);
        }
        let targetEnvName: string = process.env.NODE_ENV || "development";
        if (!jsonData[targetEnvName])
          throw new Error(`/config/${configName}.config.ts has no "${targetEnvName}" setting.`);
        let targetEnvConfig: Object = {};
        for (let envName in jsonData) {
          let envConfig = jsonData[envName];
          if (new RegExp("^" + envName.replace("*", ".*") + "$").test(targetEnvName))
            _.merge(targetEnvConfig, envConfig);
        }
        this.caches[configName] = targetEnvConfig;
      }
    }
    return this.caches[configName];
  }

}

export var configLoader = new ConfigLoader();
