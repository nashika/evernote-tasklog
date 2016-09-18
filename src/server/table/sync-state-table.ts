import evernote = require("evernote");
import {injectable} from "inversify";

import {SyncStateEntity} from "../../common/entity/sync-state-entity";
import {BaseSingleEvernoteTable} from "./base-single-evernote-table";
import {EvernoteClientService} from "../service/evernote-client-service";

@injectable()
export class SyncStateTable extends BaseSingleEvernoteTable<SyncStateEntity> {

  constructor(protected evernoteClientService: EvernoteClientService) {
    super();
  }

  loadRemote(): Promise<SyncStateEntity> {
    return this.evernoteClientService.getSyncState(this.username);
  }

}
