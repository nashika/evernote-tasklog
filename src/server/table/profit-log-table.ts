import core from "../core";
import {BaseMultiTable} from "./base-multi-table";
import {MultiTableOptions} from "./base-multi-table";
import {NoteEntity} from "../../common/entity/note-entity";
import {ProfitLogEntity} from "../../common/entity/profit-log-entity";

export class ProfitLogTable extends BaseMultiTable<ProfitLogEntity, MultiTableOptions> {

  static PLURAL_NAME: string = 'profitLogs';
  static TITLE_FIELD: string = 'comment';
  static DEFAULT_LIMIT: number = 2000;

  parse(note: NoteEntity, lines: string[]): Promise<void> {
    let profitLogs: ProfitLogEntity[] = [];
    for (var line of lines) {
      let matches: string[];
      if (matches = line.match(/(.*)[@＠][\\￥$＄](.+)/i)) {
        profitLogs.push({
          _id: null,
          noteGuid: note.guid,
          comment: matches[1],
          profit: parseInt(matches[2].replace(/,/g, '')),
        });
      }
    }
    return Promise.resolve().then(() => {
      return core.users[this._username].models.profitLogs.removeLocal({noteGuid: note.guid});
    }).then(() => {
      return core.users[this._username].models.profitLogs.saveLocal(profitLogs);
    });
  }

}
