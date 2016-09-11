import core from "../core";
import {BaseMultiTable} from "./base-multi-table";
import {MultiTableOptions} from "./base-multi-table";
import {TimeLogEntity} from "../../common/entity/time-log-entity";
import {NoteEntity} from "../../common/entity/note-entity";

export class TimeLogTable extends BaseMultiTable<TimeLogEntity, MultiTableOptions> {

  static PLURAL_NAME: string = "timeLogs";
  static TITLE_FIELD: string = "comment";
  static DEFAULT_LIMIT: number = 2000;

  parse(note: NoteEntity, lines: string[]): Promise<void> {
    let timeLogs: TimeLogEntity[] = [];
    for (var line of lines) {
      let matches: string[];
      if (matches = line.match(/(.*)[@＠](\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}.+)/)) {
        var timeLog: TimeLogEntity = {
          _id: undefined,
          noteGuid: note.guid,
          comment: matches[1],
          allDay: true,
          date: null,
          person: null,
          spentTime: null,
        };
        var attributesText: string = matches[2];
        // parse date and time
        var dateText: string = (matches = attributesText.match(/\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)) ? matches[0] : "";
        var timeText: string = (matches = attributesText.match(/\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}/)) ? matches[0] : "";
        timeLog.date = (new Date(dateText + ' ' + timeText)).getTime();
        if (timeText) timeLog.allDay = false;
        // parse person
        for (var person of core.users[this._username].settings.persons) {
          if (attributesText.indexOf(person.name) != -1)
            timeLog.person = person.name;
        }
        // parse spent time
        if (matches = attributesText.match(/\d+h\d+m|\d+m|\d+h|\d+\.\d+h/i)) {
          var spentTimeText: string = matches[0];
          var spentHour: number = (matches = spentTimeText.match(/(\d+\.?\d*)h/)) ? parseFloat(matches[1]) : 0;
          var spentMinute: number = (matches = spentTimeText.match(/(\d+\.?\d*)m/)) ? parseFloat(matches[1]) : 0;
          timeLog.spentTime = Math.round(spentHour * 60 + spentMinute);
        }
        if (timeLog.date && timeLog.person)
          timeLogs.push(timeLog);
      }
    }
    return Promise.resolve().then(() => {
      return core.users[this._username].models.timeLogs.removeLocal({noteGuid: note.guid});
    }).then(() => {
      return core.users[this._username].models.timeLogs.saveLocal(timeLogs);
    });
  }

}
