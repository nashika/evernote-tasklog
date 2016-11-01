import {injectable} from "inversify";

import {BaseMultiTable} from "./base-multi-table";
import {TimeLogEntity} from "../../common/entity/time-log-entity";
import {NoteEntity} from "../../common/entity/note-entity";
import {IMultiEntityFindOptions} from "../../common/entity/base-multi-entity";
import {SettingService} from "../service/setting-service";

@injectable()
export class TimeLogTable extends BaseMultiTable<TimeLogEntity, IMultiEntityFindOptions> {

  constructor(protected settingService: SettingService) {
    super();
  }

  parse(note: NoteEntity, lines: string[]): Promise<void> {
    let timeLogs: TimeLogEntity[] = [];
    for (let line of lines) {
      let matches: string[];
      if (matches = line.match(/(.*)[@＠](\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}.+)/)) {
        let timeLog: TimeLogEntity = new TimeLogEntity({
          _id: undefined,
          noteGuid: note.guid,
          comment: matches[1],
          allDay: true,
          date: null,
          person: null,
          spentTime: null,
        });
        let attributesText: string = matches[2];
        // parse date and time
        let dateText: string = (matches = attributesText.match(/\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)) ? matches[0] : "";
        let timeText: string = (matches = attributesText.match(/\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}/)) ? matches[0] : "";
        timeLog.date = (new Date(dateText + ' ' + timeText)).getTime();
        if (timeText) timeLog.allDay = false;
        // parse person
        for (let person of this.settingService.getUser(this.globalUser).persons) {
          if (attributesText.indexOf(person.name) != -1)
            timeLog.person = person.name;
        }
        // parse spent time
        if (matches = attributesText.match(/\d+h\d+m|\d+m|\d+h|\d+\.\d+h/i)) {
          let spentTimeText: string = matches[0];
          let spentHour: number = (matches = spentTimeText.match(/(\d+\.?\d*)h/)) ? parseFloat(matches[1]) : 0;
          let spentMinute: number = (matches = spentTimeText.match(/(\d+\.?\d*)m/)) ? parseFloat(matches[1]) : 0;
          timeLog.spentTime = Math.round(spentHour * 60 + spentMinute);
        }
        if (timeLog.date && timeLog.person)
          timeLogs.push(timeLog);
      }
    }
    return Promise.resolve().then(() => {
      return this.remove({noteGuid: note.guid});
    }).then(() => {
      return this.save(timeLogs);
    });
  }

}
