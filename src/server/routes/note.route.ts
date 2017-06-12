import {injectable} from "inversify";

import {BaseEntityRoute} from "./base-entity.route";
import {NoteTable} from "../table/note.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";

@injectable()
export class NoteRoute extends BaseEntityRoute<NoteEntity, NoteTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService) {
    super(tableService, sessionService);
  }

  async connect(socket: SocketIO.Socket): Promise<void> {
    this.on(socket, "getContent", this.onGetContent);
    this.on(socket, "reParse", this.onReParse);
  }

  protected async onGetContent(socket: SocketIO.Socket, guid: string): Promise<NoteEntity> {
    if (!guid) return null;
    let note = await this.getTable(socket).loadRemote(guid);
    return note;
  }

  protected async onReParse(socket: SocketIO.Socket, query: Object): Promise<boolean> {
    await this.getTable(socket).reParseNotes(query);
    return true;
  }

}
