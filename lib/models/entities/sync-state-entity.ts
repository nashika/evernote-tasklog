import * as evernote from "evernote";

import {SingleEntity} from "./single-entity";

export class SyncStateEntity extends evernote.Evernote.SyncState implements SingleEntity {
}
