import { injectable } from "inversify";
import _ from "lodash";

import BaseServerService from "~/src/server/service/base-server.service";
import TableService from "~/src/server/service/table.service";
import logger from "~/src/server/logger";
import NoteEntity from "~/src/common/entity/note.entity";
import ConstraintResultEntity from "~/src/common/entity/constraint-result.entity";
import configLoader from "~/src/common/util/config-loader";

@injectable()
export default class ConstraintService extends BaseServerService {
  constructor(protected tableService: TableService) {
    super();
  }

  async checkAll(): Promise<void> {
    logger.info(`全ての制約違反データを削除します.`);
    await this.tableService.constraintResultTable.clear();
    const noteCount = await this.tableService.noteTable.count();
    let notes: NoteEntity[];
    let i = 0;
    do {
      logger.info(`ノートの制約をチェック中 ${i * 100} / ${noteCount}.`);
      notes = await this.tableService.noteTable.findAll({
        take: 100,
        skip: 100 * i,
      });
      for (const note of notes) await this.check(note);
      i++;
    } while (notes.length > 0);
  }

  async checkOne(note: NoteEntity): Promise<void> {
    await this.tableService.constraintResultTable.delete({
      noteGuid: note.guid,
    });
    await this.check(note);
  }

  async removeOne(guid: string): Promise<void> {
    await this.tableService.constraintResultTable.delete({
      noteGuid: guid,
    });
  }

  private async check(note: NoteEntity): Promise<void> {
    if (note.deleted) return;
    for (const constraint of configLoader.app.constraints) {
      if (!this.eval(note, constraint.query)) continue;
      const constraintResult = new ConstraintResultEntity();
      constraintResult.noteGuid = note.guid;
      constraintResult.constraintId = constraint.id;
      await this.tableService.constraintResultTable.save(constraintResult);
    }
  }

  private eval(
    note: NoteEntity,
    query: AppConfig.IConstraintConfigQuery
  ): boolean {
    debugger;
    if (!_.isUndefined(query.title))
      if (!this.evalString(note.title, query.title)) return false;
    if (!_.isUndefined(query.created))
      if (!this.evalNumber(note.created, query.created)) return false;
    if (!_.isUndefined(query.updated))
      if (!this.evalNumber(note.updated, query.updated)) return false;
    if (!_.isUndefined(query.reminderOrder))
      if (!this.evalNumber(note.attributes?.reminderOrder, query.reminderOrder))
        return false;
    if (!_.isUndefined(query.reminderDoneTime))
      if (
        !this.evalNumber(
          note.attributes?.reminderDoneTime,
          query.reminderDoneTime
        )
      )
        return false;
    if (!_.isUndefined(query.reminderTime))
      if (!this.evalNumber(note.attributes?.reminderTime, query.reminderTime))
        return false;
    if (query.notebook || query.stack) {
      const notebook = note.notebookGuid
        ? this.tableService.caches.notebooks[note.notebookGuid]
        : null;
      if (!_.isUndefined(query.notebook))
        if (!this.evalString(notebook?.name, query.notebook)) return false;
      if (!_.isUndefined(query.stack))
        if (!this.evalString(notebook?.stack, query.stack)) return false;
    }
    if (query.tag) {
      const tagNames: string[] = [];
      for (const tagGuid of _.toArray(note.tagGuids)) {
        const tag = this.tableService.caches.tags[tagGuid];
        if (!tag.name) continue;
        tagNames.push(tag.name);
      }
      if (!this.evalTags(tagNames, query.tag)) return false;
    }
    return true;
  }

  private evalNumber(
    target: number | undefined | null,
    query: AppConfig.TConstraintConfigNumberOperator
  ): boolean {
    if (_.isNil(query)) return _.isNil(target);
    if (_.isNil(target)) return _.isNil(query);
    if (_.isNumber(query)) return target === query;
    if (_.isObject(query)) {
      if (!_.isUndefined(query.$eq) && !(target === query.$eq)) return false;
      if (!_.isUndefined(query.$ne) && !(target !== query.$ne)) return false;
      if (!_.isUndefined(query.$gt) && !(target > query.$gt)) return false;
      if (!_.isUndefined(query.$gte) && !(target >= query.$gte)) return false;
      if (!_.isUndefined(query.$lt) && !(target < query.$lt)) return false;
      if (!_.isUndefined(query.$lte) && !(target <= query.$lte)) return false;
      if (
        !_.isUndefined(query.$between) &&
        !(target >= query.$between[0] && target <= query.$between[1])
      )
        return false;
      if (
        !_.isUndefined(query.$notBetween) &&
        target >= query.$notBetween[0] &&
        target <= query.$notBetween[1]
      )
        return false;
      if (!_.isUndefined(query.$in) && !_.includes(query.$in, target))
        return false;
      if (!_.isUndefined(query.$notIn) && _.includes(query.$notIn, target))
        return false;
      if (!_.isUndefined(query.$not) && this.evalNumber(target, query.$not))
        return false;
    }
    return true;
  }

  private evalString(
    target: string | undefined | null,
    query: AppConfig.TConstraintConfigStringOperator
  ): boolean {
    if (_.isNil(target)) return _.isNil(query);
    if (_.isNil(query)) return _.isNil(target);
    if (_.isArray(query)) return _.includes(query, target);
    if (_.isRegExp(query)) return query.test(target);
    if (_.isString(query)) return target === query;
    if (_.isObject(query)) {
      if (!_.isUndefined(query.$eq) && !(target === query.$eq)) return false;
      if (!_.isUndefined(query.$ne) && !(target !== query.$ne)) return false;
      if (!_.isUndefined(query.$in) && !_.includes(query.$in, target))
        return false;
      if (!_.isUndefined(query.$notIn) && _.includes(query.$notIn, target))
        return false;
      if (!_.isUndefined(query.$not) && this.evalString(target, query.$not))
        return false;
    }
    return true;
  }

  private evalArray(
    target: string[] | undefined | null,
    query: AppConfig.TConstraintConfigArrayOperator
  ): boolean {
    if (_.isNil(target)) return false;
    if (_.isString(query)) return _.includes(target, query);
    if (_.isArray(query)) return _.every(query, q => _.includes(target, q));
    if (_.isObject(query)) {
      if (!_.isUndefined(query.$in))
        if (!_.some(query.$in, q => _.includes(target, q))) return false;
      if (!_.isUndefined(query.$notIn))
        if (_.some(query.$notIn, q => _.includes(target, q))) return false;
      if (!_.isUndefined(query.$all))
        if (!_.every(query.$all, q => _.includes(target, q))) return false;
      if (!_.isUndefined(query.$notAll))
        if (_.every(query.$notAll, q => _.includes(target, q))) return false;
    }
    return true;
  }

  private evalTags(
    target: string[] | undefined | null,
    query: AppConfig.TConstraintConfigTagsOperator
  ): boolean {
    let expandQuery: AppConfig.TConstraintConfigArrayOperator = [];
    if (_.isString(query)) expandQuery = query;
    else if (_.isArray(query)) expandQuery = query;
    else if (_.isObject(query))
      expandQuery = _.mapValues(query, value =>
        _.isUndefined(value) ? undefined : this.expandTagTree(value)
      );
    return this.evalArray(target, expandQuery);
  }

  private expandTagTree(
    target: AppConfig.TConstraintConfigTreeOperator
  ): string[] {
    if (_.isArray(target)) return target;
    if (_.isObject(target)) {
      if (target.$children)
        return this.expandTagTreeRoots(target.$children, false);
      if (target.$descendants)
        return this.expandTagTreeRoots(target.$descendants, true);
    }
    return [];
  }

  private expandTagTreeRoots(
    names: string | string[],
    recursive: boolean
  ): string[] {
    if (_.isString(names)) return this.expandTagTreeRecursive(names, recursive);
    if (_.isArray(names))
      return _.flatMap(names, name =>
        this.expandTagTreeRecursive(name, recursive)
      );
    return [];
  }

  private expandTagTreeRecursive(
    name: string | undefined,
    recursive: boolean
  ): string[] {
    if (!name) return [];
    const currentTag = _.find(
      this.tableService.caches.tags,
      tag => tag.name === name
    );
    if (!currentTag) return [];
    const childTags = _.filter(
      this.tableService.caches.tags,
      tag => tag.parentGuid === currentTag.guid
    );
    const childTagNames = childTags.map(tag => tag.name).filter(name => !!name);
    if (recursive)
      return [
        ...childTagNames,
        ...childTagNames.flatMap(name =>
          this.expandTagTreeRecursive(name, true)
        ),
      ];
    else return childTagNames;
  }
}
