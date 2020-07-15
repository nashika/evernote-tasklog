import { injectable } from "inversify";

import BaseTable from "~/src/server/table/base.table";
import ProfitLogEntity from "~/src/common/entity/profit-log.entity";
import NoteEntity from "~/src/common/entity/note.entity";

@injectable()
export default class ProfitLogTable extends BaseTable<ProfitLogEntity> {
  async parse(note: NoteEntity, lines: string[]): Promise<void> {
    const profitLogs: ProfitLogEntity[] = [];
    for (const line of lines) {
      const matches = line.match(/(.*)[@＠][\\￥$＄](.+)/i);
      if (matches) {
        profitLogs.push(
          new ProfitLogEntity({
            id: undefined,
            noteGuid: note.guid,
            comment: matches[1],
            profit: parseInt(matches[2].replace(/,/g, "")),
          })
        );
      }
    }
    if (!note.guid) return;
    await this.delete({ noteGuid: note.guid });
    await this.saveAll(profitLogs);
  }
}
