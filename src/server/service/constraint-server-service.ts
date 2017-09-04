import {injectable} from "inversify";

import {TableService} from "./table.service";
import {BaseServerService} from "./base-server.service";
import {SocketIoServerService} from "./socket-io-server-service";
import {NoteTable} from "../table/note.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {ConstraintResultTable} from "../table/constraint-result.table";
import {ConstraintResultEntity} from "../../common/entity/constraint-result.entity";
import {logger} from "../logger";

@injectable()
export class ConstraintServerService extends BaseServerService {

  constructor(protected tableService: TableService,
              protected socketIoServerService: SocketIoServerService) {
    super();
  }

  async checkAll(): Promise<void> {
    let constraintResultTable = this.tableService.getTable<ConstraintResultTable>(ConstraintResultEntity);
    let noteTable = this.tableService.getTable<NoteTable>(NoteEntity);
    logger.info(`Delete all constraintResult datas.`);
    await constraintResultTable.remove({where: {}});
    let notes: NoteEntity[];
    let i = 0;
    do {
      notes = await noteTable.findAll({limit: 100, offset: 100 * i});
      for (let note of notes) {
        console.log(note.title);
      }
      i++;
    } while (notes.length > 0)
  }

}
