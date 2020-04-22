declare namespace AppConfig {
  interface IAppConfigs {
    [env: string]: Partial<IAppConfig>;
  }

  interface IAppConfig {
    baseUrl: string;
    port: number;
    logLevel: string;
    sqlLogging: boolean;
    sandbox: boolean;
    token: string;
    persons: IPersonConfig[];
    warningNoteCount: number;
    workingTimeStart: number;
    workingTimeEnd: number;
    defaultFilterParams: {
      timeline: IDefaultFilterParamsConfig;
      notes: IDefaultFilterParamsConfig;
      activity: IDefaultFilterParamsConfig;
    };
    constraints: IConstraintConfig[];
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
    title?: TConstraintConfigStringOperator;
    notebook?: TConstraintConfigStringOperator;
    stack?: TConstraintConfigStringOperator;
    tag?: TConstraintConfigArrayOperator;
    created?: TConstraintConfigNumberOperator;
    updated?: TConstraintConfigNumberOperator;
    reminderOrder?: TConstraintConfigNumberOperator;
    reminderDoneTime?: TConstraintConfigNumberOperator;
    reminderTime?: TConstraintConfigNumberOperator;
    $and?: IConstraintConfigQuery[];
    $or?: IConstraintConfigQuery[];
  }

  type TConstraintConfigStringOperator =
    | undefined
    | string
    | string[]
    | RegExp
    | {
        $eq?: string;
        $ne?: string;
        $in?: string[];
        $notIn?: string[];
        $not?: TConstraintConfigStringOperator;
      };

  type TConstraintConfigNumberOperator =
    | null
    | undefined
    | number
    | {
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
      };

  type TConstraintConfigArrayOperator =
    | undefined
    | string
    | string[]
    | {
        $in?: TConstraintConfigTreeOperator;
        $notIn?: TConstraintConfigTreeOperator;
        $all?: TConstraintConfigTreeOperator;
        $notAll?: TConstraintConfigTreeOperator;
      };

  type TConstraintConfigTreeOperator =
    | undefined
    | string[]
    | {
        $children?: string | string[];
        $descendants?: string | string[];
      };

  namespace loader {
    const app: IAppConfig;
  }
}
