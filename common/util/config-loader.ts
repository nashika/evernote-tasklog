import * as _ from "lodash";

import appConfig from "~/config/app.config";

class ConfigLoader {
  private caches: { [configName: string]: any };

  constructor() {
    this.caches = {};
  }

  get app(): appConfig.IAppConfig {
    return this.load("app", appConfig);
  }

  private load(configName: string, config: any): any {
    if (!this.caches[configName]) {
      const targetEnvName: string = process.env.NODE_ENV || "development";
      if (!config[targetEnvName]) {
        throw new Error(`/config/${configName}.config.ts has no "${targetEnvName}" setting.`);
      }
      const targetEnvConfig: Object = {};
      for (const envName in config) {
        const envConfig = config[envName];
        if (new RegExp("^" + envName.replace("*", ".*") + "$").test(targetEnvName)) {
          _.merge(targetEnvConfig, envConfig);
        }
      }
      this.caches[configName] = targetEnvConfig;
    }
    return this.caches[configName];
  }
}

export const configLoader = new ConfigLoader();
