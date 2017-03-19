import _ = require("lodash");

import {BaseTable, ISequelizeInstance} from "./base.table";
import {
  BaseMultiEntity, IMyFindEntityOptions, IMyCountEntityOptions,
  IMyDestroyEntityOptions
} from "../../common/entity/base-multi.entity";

export class BaseMultiTable<T extends BaseMultiEntity> extends BaseTable<T> {

  EntityClass: typeof BaseMultiEntity;

  get Class(): typeof BaseMultiTable {
    return <typeof BaseMultiTable>this.constructor;
  }

  async findOne(options: IMyFindEntityOptions = {}): Promise<T> {
    options = this.parseOptions(options);
    this.message("find", ["local"], this.EntityClass.params.name, true, {query: options});
    let instance: ISequelizeInstance<T> = await this.sequelizeModel.findOne(options);
    this.message("find", ["local"], this.EntityClass.params.name, false, {query: options});
    return instance ? this.prepareLoadEntity(instance) : null;
  }

  async findAll(options: IMyFindEntityOptions = null): Promise<T[]> {
    options = this.parseOptions(options);
    let model = options.archive ? this.archiveSequelizeModel : this.sequelizeModel;
    this.message("find", ["local"], this.EntityClass.params.name, true, {options: options});
    let instances: ISequelizeInstance<T>[] = await model.findAll(options);
    this.message("find", ["local"], this.EntityClass.params.name, false, {"length": instances.length, options: options});
    return _.map(instances, instance => this.prepareLoadEntity(instance));
  }

  async count(options: IMyCountEntityOptions = {}): Promise<number> {
    options = this.parseOptions(options);
    let model = options.archive ? this.archiveSequelizeModel : this.sequelizeModel;
    this.message("count", ["local"], this.EntityClass.params.name, true, options);
    let count = await model.count(options);
    this.message("count", ["local"], this.EntityClass.params.name, false, {count: count});
    return count;
  }

  private parseOptions(options: any): any {
    let result: any = options || <any>_.cloneDeep(this.EntityClass.params.default);
    result.where = _.merge(result.where || {}, this.EntityClass.params.append.where || {});
    result.order = _.concat(result.order || [], this.EntityClass.params.append.order || []);
    return result;
  }

  async save(entity: T, archive: boolean = false): Promise<T> {
    if (!entity) return null;
    this.message("save", ["local"], this.EntityClass.params.name, true, {primaryKey: entity.primaryKey, displayField: entity.displayField});
    let savedInstance: ISequelizeInstance<T>;
    let oldInstance: ISequelizeInstance<T>;
    if (entity.primaryKey) {
      oldInstance = await this.sequelizeModel.findByPrimary(entity.primaryKey);
    }
    savedInstance = await this.sequelizeModel.build(this.prepareSaveEntity(entity), {isNewRecord: !oldInstance}).save();
    let savedEntity = this.prepareLoadEntity(savedInstance);
    this.message("save", ["local"], this.EntityClass.params.name, false, {primaryKey: entity.primaryKey, displayField: entity.displayField});
    if (this.EntityClass.params.archive && archive) {
      this.message("save", ["local", "archive"], this.EntityClass.params.name, true, {primaryKey: entity.primaryKey, displayField: entity.displayField});
      await this.archiveSequelizeModel.create(this.prepareSaveEntity(savedEntity));
      this.message("save", ["local", "archive"], this.EntityClass.params.name, false, {primaryKey: entity.primaryKey, displayField: entity.displayField});
    }
    return savedEntity;
  }

  async saveAll(entities: T[]): Promise<T[]> {
    if (!entities || entities.length == 0) return [];
    this.message("saveAll", ["local"], this.EntityClass.params.name, true, {"count": entities.length});
    let saveEntities: T[] = [];
    for (let entity of entities)
      saveEntities.push(await this.save(entity));
    this.message("saveAll", ["local"], this.EntityClass.params.name, false, {"count": entities.length});
    return saveEntities;
  }

  async remove(options: IMyDestroyEntityOptions): Promise<void> {
    if (!options) return;
    this.message("remove", ["local"], this.EntityClass.params.name, true, {query: options});
    let numRemoved = await this.sequelizeModel.destroy(options);
    this.message("remove", ["local"], this.EntityClass.params.name, false, {query: options, numRemoved: numRemoved});
  }

}
