import * as _ from "lodash";

import appConfig from "~/config/app.config";

class AppConfigLoader {
  private readonly caches: { [configName: string]: any };

  constructor() {
    this.caches = {};
  }

  get app(): AppConfig.IAppConfig {
    return this.load("app", appConfig);
  }

  private load(configName: string, config: any): any {
    if (!this.caches[configName]) {
      const targetEnvName: string = process.env.NODE_ENV || "development";
      if (!config[targetEnvName]) {
        throw new Error(
          `/config/${configName}.config.ts has no "${targetEnvName}" setting.`
        );
      }
      const targetEnvConfig: Object = {};
      for (const envName in config) {
        const envConfig = config[envName];
        if (
          new RegExp("^" + envName.replace("*", ".*") + "$").test(targetEnvName)
        ) {
          _.merge(targetEnvConfig, envConfig);
        }
      }
      this.caches[configName] = targetEnvConfig;
    }
    return this.caches[configName];
  }
}

export const appConfigLoader = new AppConfigLoader();
