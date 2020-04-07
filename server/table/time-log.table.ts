import {injectable} from "inversify";
import sequelize = require("sequelize");

import {TimeLogEntity} from "../../common/entity/time-log.entity";
import {NoteEntity} from "../../common/entity/note.entity";
import {IBaseTableParams, BaseTable} from "./base.table";
import {configLoader} from "../../common/util/config-loader";

@injectable()
export class TimeLogTable extends BaseTable<TimeLogEntity> {

  static params: IBaseTableParams = {
    fields: {
      id: {type: sequelize.INTEGER, primaryKey: true, autoIncrement: true},
      noteGuid: {type: sequelize.STRING, allowNull: false},
      comment: {type: sequelize.TEXT, allowNull: true},
      allDay: {type: sequelize.BOOLEAN, allowNull: false},
      date: {type: sequelize.BIGINT, allowNull: false},
      personId: {type: sequelize.INTEGER, allowNull: false},
      spentTime: {type: sequelize.INTEGER, allowNull: true},
    },
    options: {
      indexes: [],
    },
    jsonFields: [],
  };

  async parse(note: NoteEntity, lines: string[]): Promise<void> {
    let timeLogs: TimeLogEntity[] = [];
    for (let line of lines) {
      let matches: string[];
      if (matches = line.match(/(.*)[@＠](\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}.+)/)) {
        let timeLog: TimeLogEntity = new TimeLogEntity({
          id: undefined,
          noteGuid: note.guid,
          comment: matches[1],
          allDay: true,
          date: null,
          personId: 0,
          spentTime: null,
        });
        let attributesText: string = matches[2];
        // parse date and time
        let dateText: string = (matches = attributesText.match(/\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)) ? matches[0] : "";
        let timeText: string = (matches = attributesText.match(/\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}/)) ? matches[0] : "";
        timeLog.date = (new Date(dateText + ' ' + timeText)).getTime();
        if (timeText) timeLog.allDay = false;
        // parse person
        for (let person of configLoader.app.persons) {
          if (attributesText.indexOf(person.name) != -1)
            timeLog.personId = person.id;
        }
        // parse spent time
        if (matches = attributesText.match(/\d+h\d+m|\d+m|\d+h|\d+\.\d+h/i)) {
          let spentTimeText: string = matches[0];
          let spentHour: number = (matches = spentTimeText.match(/(\d+\.?\d*)h/)) ? parseFloat(matches[1]) : 0;
          let spentMinute: number = (matches = spentTimeText.match(/(\d+\.?\d*)m/)) ? parseFloat(matches[1]) : 0;
          timeLog.spentTime = Math.round(spentHour * 60 + spentMinute);
        }
        if (timeLog.date && timeLog.personId)
          timeLogs.push(timeLog);
      }
    }
    await this.remove({where: {noteGuid: note.guid}});
    await this.saveAll(timeLogs);
  }

}
