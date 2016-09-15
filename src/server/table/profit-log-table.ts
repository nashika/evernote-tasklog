import {injectable} from "inversify";

import {BaseMultiTable} from "./base-multi-table";
import {NoteEntity} from "../../common/entity/note-entity";
import {ProfitLogEntity} from "../../common/entity/profit-log-entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";

@injectable()
export class ProfitLogTable extends BaseMultiTable<ProfitLogEntity, IMultiEntityFindOptions> {

  parse(note: NoteEntity, lines: string[]): Promise<void> {
    let profitLogs: ProfitLogEntity[] = [];
    for (var line of lines) {
      let matches: string[];
      if (matches = line.match(/(.*)[@＠][\\￥$＄](.+)/i)) {
        profitLogs.push(new ProfitLogEntity({
          _id: undefined,
          noteGuid: note.guid,
          comment: matches[1],
          profit: parseInt(matches[2].replace(/,/g, '')),
        }));
      }
    }
    return Promise.resolve().then(() => {
      return this.remove({noteGuid: note.guid});
    }).then(() => {
      return this.save(profitLogs);
    });
  }

}
