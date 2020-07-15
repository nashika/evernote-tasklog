import { injectable } from "inversify";

import BaseTable from "~/src/server/table/base.table";
import TimeLogEntity from "~/src/common/entity/time-log.entity";
import NoteEntity from "~/src/common/entity/note.entity";
import configLoader from "~/src/common/util/config-loader";

@injectable()
export default class TimeLogTable extends BaseTable<TimeLogEntity> {
  async parse(note: NoteEntity, lines: string[]): Promise<void> {
    const timeLogs: TimeLogEntity[] = [];
    for (const line of lines) {
      let matches = line.match(/(.*)[@＠](\d{2,4}[/-]\d{1,2}[/-]\d{1,2}.+)/);
      if (matches) {
        const timeLog: TimeLogEntity = new TimeLogEntity({
          id: undefined,
          noteGuid: note.guid,
          comment: matches[1],
          allDay: true,
          date: null,
          personId: 0,
          spentTime: null,
        });
        const attributesText: string = matches[2];
        // parse date and time
        matches = attributesText.match(/\d{2,4}[/-]\d{1,2}[/-]\d{1,2}/);
        const dateText: string = matches ? matches[0] : "";
        matches = attributesText.match(
          /\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}/
        );
        const timeText: string = matches ? matches[0] : "";
        timeLog.date = new Date(dateText + " " + timeText).getTime();
        if (timeText) timeLog.allDay = false;
        // parse person
        for (const person of configLoader.app.persons) {
          if (attributesText.includes(person.name))
            timeLog.personId = person.id;
        }
        // parse spent time
        if ((matches = attributesText.match(/\d+h\d+m|\d+m|\d+h|\d+\.\d+h/i))) {
          const spentTimeText: string = matches[0];
          matches = spentTimeText.match(/(\d+\.?\d*)h/);
          const spentHour: number = matches ? parseFloat(matches[1]) : 0;
          matches = spentTimeText.match(/(\d+\.?\d*)m/);
          const spentMinute: number = matches ? parseFloat(matches[1]) : 0;
          timeLog.spentTime = Math.round(spentHour * 60 + spentMinute);
        }
        if (timeLog.date && timeLog.personId) timeLogs.push(timeLog);
      }
    }
    await this.delete({ noteGuid: note.guid });
    await this.saveAll(timeLogs);
  }
}
