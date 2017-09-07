import {injectable} from "inversify";
import * as _ from "lodash";

import {TableService} from "./table.service";
import {BaseServerService} from "./base-server.service";
import {NoteEntity} from "../../common/entity/note.entity";
import {logger} from "../logger";
import {configLoader} from "../../common/util/config-loader";
import {ConstraintResultEntity} from "../../common/entity/constraint-result.entity";

@injectable()
export class ConstraintService extends BaseServerService {

  constructor(protected tableService: TableService) {
    super();
  }

  async checkAll(): Promise<void> {
    logger.info(`Delete all constraintResult datas.`);
    await this.tableService.constraintResultTable.remove({where: {}});
    let noteCount = await this.tableService.noteTable.count();
    let notes: NoteEntity[];
    let i = 0;
    do {
      logger.info(`Checking constraint ${i * 100} / ${noteCount}.`);
      notes = await this.tableService.noteTable.findAll({limit: 100, offset: 100 * i});
      for (let note of notes)
        await this.check(note);
      i++;
    } while (notes.length > 0)
  }

  async checkOne(note: NoteEntity): Promise<void> {
    await this.tableService.constraintResultTable.remove({where: {noteGuid: note.guid}});
    this.check(note);
  }

  async removeOne(guid: string): Promise<void> {
    await this.tableService.constraintResultTable.remove({where: {noteGuid: guid}});
  }

  private async check(note: NoteEntity): Promise<void> {
    if (note.deleted) return;
    for (let constraint of configLoader.app.constraints) {
      if (!this.eval(note, constraint.query)) continue;
      let constraintResult = new ConstraintResultEntity();
      constraintResult.noteGuid = note.guid;
      constraintResult.constraintId = constraint.id;
      await this.tableService.constraintResultTable.save(constraintResult);
    }
  }

  private eval(note: NoteEntity, query: config.IConstraintConfigQuery): boolean {
    if (!this.evalString(note.title, query.title)) return false;
    if (!this.evalNumber(note.created, query.created)) return false;
    if (!this.evalNumber(note.updated, query.updated)) return false;
    if (!this.evalNumber(note.attributes.reminderOrder, query.reminderOrder)) return false;
    if (!this.evalNumber(note.attributes.reminderDoneTime, query.reminderDoneTime)) return false;
    if (!this.evalNumber(note.attributes.reminderTime, query.reminderTime)) return false;
    if (query.notebook || query.stack) {
      let notebook = this.tableService.caches.notebooks[note.notebookGuid];
      if (!this.evalString(notebook ? notebook.name : null, query.notebook)) return false;
      if (!this.evalString(notebook ? notebook.stack : null, query.stack)) return false;
    }
    if (query.tag) {
      let tagNames: string[] = [];
      for (let tagGuid of _.toArray(note.tagGuids)) {
        let tag = this.tableService.caches.tags[tagGuid];
        tagNames.push(tag.name);
      }
      if (!this.evalArray(tagNames, query.tag)) return false;
    }
    return true;
  }

  private evalNumber(target: number, query: config.TConstraintConfigNumberOperator): boolean {
    if (_.isUndefined(target)) return true;
    if (_.isNull(query)) return _.isNull(target);
    if (_.isNumber(query)) return target == query;
    if (_.isObject(query)) {
      if (!_.isUndefined(query.$eq) && !(target == query.$eq)) return false;
      if (!_.isUndefined(query.$ne) && !(target != query.$ne)) return false;
      if (!_.isUndefined(query.$gt) && !(target > query.$gt)) return false;
      if (!_.isUndefined(query.$gte) && !(target >= query.$gte)) return false;
      if (!_.isUndefined(query.$lt) && !(target < query.$lt)) return false;
      if (!_.isUndefined(query.$lte) && !(target <= query.$lte)) return false;
      if (!_.isUndefined(query.$between) && !(target >= query.$between[0] && target <= query.$between[1])) return false;
      if (!_.isUndefined(query.$notBetween) && (target >= query.$notBetween[0] && target <= query.$notBetween[1])) return false;
      if (!_.isUndefined(query.$in) && !(_.includes(query.$in, target))) return false;
      if (!_.isUndefined(query.$notIn) && (_.includes(query.$in, target))) return false;
      if (!_.isUndefined(query.$not) && this.evalNumber(target, query.$not)) return false;
    }
    return true;
  }

  private evalString(target: string, query: config.TConstraintConfigStringOperator): boolean {
    if (_.isUndefined(target)) return true;
    if (_.isNull(query)) return _.isNull(target);
    if (_.isArray(query)) return _.includes(query, target);
    if (_.isRegExp(query)) return query.test(target);
    if (_.isString(query)) return target == query;
    if (_.isObject(query)) {
      if (!_.isUndefined(query.$eq) && !(target == query.$eq)) return false;
      if (!_.isUndefined(query.$ne) && !(target != query.$ne)) return false;
      if (!_.isUndefined(query.$in) && !(_.includes(query.$in, target))) return false;
      if (!_.isUndefined(query.$notIn) && (_.includes(query.$notIn, target))) return false;
      if (!_.isUndefined(query.$not) && this.evalString(target, query.$not)) return false;
    }
    return true;
  }

  private evalArray(target: string[], query: config.TConstraintConfigArrayOperator): boolean {
    if (_.isUndefined(target)) return true;
    if (_.isNull(query)) return _.isNull(target);
    if (_.isString(query)) return _.includes(target, query);
    if (_.isArray(query)) return _.every(query, q => _.includes(target, q));
    if (_.isObject(query)) {
      if (!_.isUndefined(query.$in) && !(_.some(this.evalTree(query.$in),q => _.includes(target, q)))) return false;
      if (!_.isUndefined(query.$notIn) && (_.some(this.evalTree(query.$notIn), q => _.includes(target, q)))) return false;
      if (!_.isUndefined(query.$all) && !(_.every(this.evalTree(query.$all), q => _.includes(target, q)))) return false;
      if (!_.isUndefined(query.$notAll) && (_.every(this.evalTree(query.$notAll), q => _.includes(target, q)))) return false;
    }
    return true;
  }

  private evalTree(target: config.TConstraintConfigTreeOperator): string[] {
    if (_.isArray(target)) return target;
    if (_.isObject(target)) {
      if (target.$children) return this.evalTreeRoots(target.$children, false);
      if (target.$descendants) return this.evalTreeRoots(target.$descendants, true);
    }
    return [];
  }

  private evalTreeRoots(names: string | string[], recursive: boolean): string[] {
    if (_.isString(names)) return this.evalTreeRecursive(names, recursive);
    if (_.isArray(names)) return _.flatMap(names, name => this.evalTreeRecursive(name, recursive));
    return [];
  }

  private evalTreeRecursive(name: string, recursive: boolean): string[] {
    let currentTag = _.find(this.tableService.caches.tags, tag => tag.name == name);
    let childTags = _.filter(this.tableService.caches.tags, tag => tag.parentGuid == currentTag.guid);
    let childTagNames = _.map(childTags, tag => tag.name);
    if (recursive)
      return _.concat(childTagNames, _.flatMap(childTagNames, name => this.evalTreeRecursive(name, true)));
    else
      return childTagNames;
  }

}
