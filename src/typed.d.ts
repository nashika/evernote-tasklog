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
