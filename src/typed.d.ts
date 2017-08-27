declare module "bootstrap-vue" {
  var BootstrapVue: any;
  export = BootstrapVue;
}

declare namespace SocketIO {
  interface Socket extends NodeJS.EventEmitter {
    handshake: {
      session: Express.Session;
    }
  }
}

declare namespace config {

  interface IAppConfigs {
    [env: string]: IAppConfig;
  }

  declare interface IAppConfig {
    baseUrl?: string;
    port?: number;
    logLevel?: string;
    dbName?: string;
    sandbox?: boolean;
    token?: string;
    persons?: IPersonConfig[];
    warningNoteCount?: number;
    workingTimeStart?: number;
    workingTimeEnd?: number;
    defaultFilterParams?: {
      timeline: IDefaultFilterParamsConfig;
      notes: IDefaultFilterParamsConfig;
      activity: IDefaultFilterParamsConfig;
    };
  }

  interface IPersonConfig {
    id: number;
    name: string;
  }

  interface IDefaultFilterParamsConfig {
    stacks?: string[];
    notebooks?: string[];
  }

  namespace loader {
    var app: IAppConfig;
  }
}
