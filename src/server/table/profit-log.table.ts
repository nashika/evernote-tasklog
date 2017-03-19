import {injectable} from "inversify";
import sequelize = require("sequelize");

import {BaseMultiTable} from "./base-multi.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {ProfitLogEntity} from "../../common/entity/profit-log.entity";
import {IBaseTableParams} from "./base.table";

@injectable()
export class ProfitLogTable extends BaseMultiTable<ProfitLogEntity> {

  static params: IBaseTableParams = {
    fields: {
      id: {type: sequelize.INTEGER, primaryKey: true},
      noteGuid: {type: sequelize.STRING, allowNull: false},
      comment: {type: sequelize.TEXT, allowNull: true},
      profit: {type: sequelize.INTEGER, allowNull: false},
    },
    options: {
      indexes: [],
    },
    jsonFields: [],
  };


  async parse(note: NoteEntity, lines: string[]): Promise<void> {
    let profitLogs: ProfitLogEntity[] = [];
    for (var line of lines) {
      let matches: string[];
      if (matches = line.match(/(.*)[@＠][\\￥$＄](.+)/i)) {
        profitLogs.push(new ProfitLogEntity({
          id: undefined,
          noteGuid: note.guid,
          comment: matches[1],
          profit: parseInt(matches[2].replace(/,/g, '')),
        }));
      }
    }
    await this.remove({where: {noteGuid: note.guid}});
    await this.saveAll(profitLogs);
  }

}
