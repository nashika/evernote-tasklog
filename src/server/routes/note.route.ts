import {injectable} from "inversify";

import {BaseEntityRoute} from "./base-entity.route";
import {NoteTable} from "../table/note.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";
import {SyncService} from "../service/sync.service";

@injectable()
export class NoteRoute extends BaseEntityRoute<NoteEntity, NoteTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService,
              protected syncService: SyncService) {
    super(tableService, sessionService);
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    await super.connect(socket);
    this.on(socket, "getContent", this.onGetContent);
    this.on(socket, "reParse", this.onReParse);
  }

  protected async onGetContent(_socket: SocketIO.Socket, guid: string): Promise<NoteEntity> {
    if (!guid) return null;
    await this.syncService.lock();
    let note = await this.getTable().loadRemote(guid);
    await this.syncService.unlock();
    return note;
  }

  protected async onReParse(_socket: SocketIO.Socket, query: Object): Promise<boolean> {
    await this.syncService.lock();
    await this.getTable().reParseNotes(query);
    await this.syncService.unlock();
    return true;
  }

}
