import {injectable} from "inversify";
import * as _ from "lodash";

import {TableService} from "./table.service";
import {BaseServerService} from "./base-server.service";
import {NoteEntity} from "../../common/entity/note.entity";
import {logger} from "../logger";
import {configLoader} from "../../common/util/config-loader";
import {ConstraintResultEntity} from "../../common/entity/constraint-result.entity";

@injectable()
export class ConstraintServerService extends BaseServerService {

  constructor(protected tableService: TableService) {
    super();
  }

  async checkAll(): Promise<void> {
    logger.info(`Delete all constraintResult datas.`);
    await this.tableService.constraintResultTable.remove({where: {}});
    let notes: NoteEntity[];
    let i = 0;
    do {
      notes = await this.tableService.noteTable.findAll({limit: 100, offset: 100 * i});
      for (let note of notes) {
        this.check(note);
      }
      i++;
    } while (notes.length > 0)
  }

  async checkOne(note: NoteEntity): Promise<void> {
    await this.tableService.constraintResultTable.remove({where: {noteGuid: note.guid}});
    this.check(note);
  }

  private async check(note: NoteEntity): Promise<void> {
    for (let constraint of configLoader.app.constraints) {
      if (!await this.eval(note, constraint.query)) continue;
      let constraintResult = new ConstraintResultEntity();
      constraintResult.noteGuid = note.guid;
      constraintResult.constraintId = constraint.id;
      await this.tableService.constraintResultTable.save(constraintResult);
    }
  }

  private async eval(note: NoteEntity, query: config.IConstraintConfigQuery): Promise<boolean> {
    //if (!this.evalMulti(_.map(note.tagGuids), query.tag))
    if (!this.evalNumber(note.created, query.created)) return false;
    if (!this.evalNumber(note.updated, query.updated)) return false;
    return true;
  }

  private evalNumber(number: number, query: config.TConstraintConfigNumberOperator): boolean {
    if (_.isUndefined(number) === undefined) return true;
    if (_.isNumber(query)) return number == query;
    if (_.isNull(query)) return number === null;
    if (_.isObject(query)) {
      if (!_.isUndefined(query.$gt) && !(number > query.$gt)) return false;
      if (!_.isUndefined(query.$gte) && !(number >= query.$gte)) return false;
      if (!_.isUndefined(query.$lt) && !(number < query.$lt)) return false;
    }
  }

}
