declare module "bootstrap-vue" {
  let BootstrapVue: any;
  export = BootstrapVue;
}

declare namespace SocketIO {
  interface Socket extends NodeJS.EventEmitter {
    handshake: {
      session: Express.Session;
    }
  }
}

declare module "evernote" {
  let Evernote: any;
  export = Evernote;
}

declare namespace Evernote {
  export interface Client {
    getUserStore(): UserStore;
    getNoteStore(): NoteStore;
  }
  export interface UserStore {
    getUser(): User;
  }
  interface SyncChunkConstructor {
    new (): SyncChunk;
  }
  export interface NoteStore {
    getNote(string, boolean, boolean, boolean, boolean): Note;
    getSyncState(): Evernote.SyncState;
    getFilteredSyncChunk(number, number, SyncChunkFilter): SyncChunk;
    SyncChunkFilter: SyncChunkConstructor;
  }
  export interface User {
    id: string;
    shardId: string;
  }
  export interface Note {
  }
  export interface Notebook {
  }
  export interface Tag {
  }
  export interface SavedSearch {
  }
  export interface LinkedNotebook {
  }
  export interface SyncState {
    updateCount: number;
  }
  export interface SyncChunk {
    chunkHighUSN: number;
    updateCount: number;
    notes: Note[];
    expungedNotes: string[];
    notebooks: Notebook[];
    expungedNotebooks: string[];
    tags: Tag[];
    expungedTags: string[];
    searches: SavedSearch[];
    expungedSearches: string[];
    linkedNotebooks: LinkedNotebook[];
    expungedLinkedNotebooks: string[];
  }
  export interface SyncChunkFilter {
    includeNotes: boolean;
    includeNotebooks: boolean;
    includeTags: true;
    includeSearches: true;
    includeExpunged: true;
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
