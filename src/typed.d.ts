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
    constraint?: IConstraintConfig;
  }

  interface IPersonConfig {
    id: number;
    name: string;
  }

  interface IDefaultFilterParamsConfig {
    stacks?: string[];
    notebooks?: string[];
  }

  interface IConstraintConfig {
    title?: TConstraintConfigOperator;
    notebook?: TConstraintConfigOperator;
    tag?: TConstraintConfigOperator;
    created?: TConstraintConfigOperator;
    updated?: TConstraintConfigOperator;
    reminderOrder?: TConstraintConfigOperator;
    reminderDoneTime?: TConstraintConfigOperator;
    reminderTime?: TConstraintConfigOperator;
  }

  type TConstraintConfigOperator = number | string | {
    $and?: TConstraintConfigOperator[];
    $or?: TConstraintConfigOperator[];
    $gt?: number;
    $gte?: number;
    $lt?: number;
    $lte?: number;
    $ne?: number | string;
    $eq?: number | string;
    $not?: boolean;
    $between?: [number, number];
    $notBetween?: [number, number];
    $in?: (number | string)[];
    $notIn?: (number | string)[];
    $like?: string;
    $notLike?: string;
  }

  namespace loader {
    var app: IAppConfig;
  }
}
