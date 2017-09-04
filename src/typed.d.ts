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
    constraints?: IConstraintConfig[];
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
    id: number;
    label: string;
    query: IConstraintConfigQuery;
  }

  interface IConstraintConfigQuery {
    $and?: TConstraintConfigQuery[];
    $or?: TConstraintConfigQuery[];
    title?: TConstraintConfigTextOperator;
    stack?: TConstraintConfigSingleOperator;
    notebook?: TConstraintConfigSingleOperator;
    tag?: TConstraintConfigMultiOperator;
    created?: TConstraintConfigNumberOperator;
    updated?: TConstraintConfigNumberOperator;
    reminderOrder?: TConstraintConfigNumberOperator;
    reminderDoneTime?: TConstraintConfigNumberOperator;
    reminderTime?: TConstraintConfigNumberOperator;
  }

  type TConstraintConfigSingleOperator = string | {
    $eq?: string;
    $ne?: string;
    $in?: string[];
    $notIn: string[];
  }

  type TConstraintConfigMultiOperator = string | string[] | {
    $in?: string[];
    $notIn: string[];
  }

  type TConstraintConfigTextOperator = string | {
    $eq?: string;
    $ne?: string;
    $in?: string[];
    $notIn?: string[];
    $like?: string;
    $notLike?: string;
  }

  type TConstraintConfigNumberOperator = number | {
    $gt?: number;
    $gte?: number;
    $lt?: number;
    $lte?: number;
    $ne?: number;
    $eq?: number;
    $not?: boolean;
    $between?: [number, number];
    $notBetween?: [number, number];
    $in?: number[];
    $notIn?: number[];
  }

  namespace loader {
    var app: IAppConfig;
  }
}
