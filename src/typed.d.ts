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
    repetitions?: IRepetitionConfig[];
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

  interface IRepetitionConfig {
    id: number;
    label: string;
    noteGuid: string;
  }

  interface IConstraintConfig {
    id: number;
    label: string;
    query: IConstraintConfigQuery;
  }

  interface IConstraintConfigQuery {
    title?: TConstraintConfigStringOperator;
    notebook?: TConstraintConfigStringOperator;
    stack?: TConstraintConfigStringOperator;
    tag?: TConstraintConfigArrayOperator;
    created?: TConstraintConfigNumberOperator;
    updated?: TConstraintConfigNumberOperator;
    reminderOrder?: TConstraintConfigNumberOperator;
    reminderDoneTime?: TConstraintConfigNumberOperator;
    reminderTime?: TConstraintConfigNumberOperator;
    $and?: TConstraintConfigQuery[];
    $or?: TConstraintConfigQuery[];
  }

  type TConstraintConfigStringOperator = string | string[] | RegExp | {
    $eq?: string;
    $ne?: string;
    $in?: string[];
    $notIn?: string[];
    $not?: TConstraintConfigStringOperator;
  }

  type TConstraintConfigNumberOperator = number | {
    $gt?: number;
    $gte?: number;
    $lt?: number;
    $lte?: number;
    $ne?: number;
    $eq?: number;
    $between?: [number, number];
    $notBetween?: [number, number];
    $in?: number[];
    $notIn?: number[];
    $not?: TConstraintConfigNumberOperator;
  }

  type TConstraintConfigArrayOperator = string | string[] | {
    $in?: TConstraintConfigTreeOperator;
    $notIn?: TConstraintConfigTreeOperator;
    $all?: TConstraintConfigTreeOperator;
    $notAll?: TConstraintConfigTreeOperator;
  }

  type TConstraintConfigTreeOperator = string[] | {
    $children?: string | string[];
    $descendants?: string | string[];
  }

  namespace loader {
    var app: IAppConfig;
  }
}
