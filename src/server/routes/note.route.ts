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
    this.on(socket, "saveRemote", this.onSaveRemote);
    this.on(socket, "reParse", this.onReParse);
  }

  protected async onGetContent(_socket: SocketIO.Socket, guid: string): Promise<NoteEntity> {
    if (!guid) return null;
    await this.syncService.lock();
    let note;
    try {
      note = await this.getTable().loadRemote(guid);
    } finally {
      await this.syncService.unlock();
    }
    return note;
  }

  protected async onSaveRemote(_socket: SocketIO.Socket, data: Object): Promise<NoteEntity> {
    let note: NoteEntity = new NoteEntity(data);
    await this.syncService.lock();
    let savedNote;
    try {
      savedNote = await this.getTable().saveRemote(note);
    } finally {
      await this.syncService.unlock();
    }
    return savedNote;
  }

  protected async onReParse(_socket: SocketIO.Socket, query: Object): Promise<boolean> {
    await this.syncService.lock();
    try {
      await this.getTable().reParseNotes(query);
    } finally {
      await this.syncService.unlock();
    }
    return true;
  }

}
