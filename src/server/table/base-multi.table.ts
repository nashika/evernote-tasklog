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
    return instance ? new (<any>this.EntityClass)(instance.toJSON()) : null;
  }

  async findAll(options: IMyFindEntityOptions = null): Promise<T[]> {
    options = this.parseOptions(options);
    let model = options.archive ? this.archiveSequelizeModel : this.sequelizeModel;
    this.message("find", ["local"], this.EntityClass.params.name, true, {options: options});
    let instances: ISequelizeInstance<T>[] = await model.findAll(options);
    this.message("find", ["local"], this.EntityClass.params.name, false, {"length": instances.length, options: options});
    return _.map(instances, instance => new (<any>this.EntityClass)(instance.toJSON()));
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

  async save(entities: T|T[]): Promise<void> {
    if (!entities) return Promise.resolve();
    let arrEntities: T[] = _.castArray(entities);
    if (arrEntities.length == 0) return Promise.resolve();
    this.message("save", ["local"], this.EntityClass.params.name, true, {"docs.count": arrEntities.length});
    for (let entity of arrEntities) {
      this.message("upsert", ["local"], this.EntityClass.params.name, true, {id: entity.id, title: _.get(entity, this.EntityClass.params.titleField)});
      await this.sequelizeModel.upsert(entity, {}).then(() => {
        this.message("upsert", ["local"], this.EntityClass.params.name, false, {id: entity.id});
      });
    }
    this.message("save", ["local"], this.EntityClass.params.name, false, {"docs.count": arrEntities.length});
  }

  async remove(options: IMyDestroyEntityOptions): Promise<void> {
    if (!options) return;
    this.message("remove", ["local"], this.EntityClass.params.name, true, {query: options});
    return await this.sequelizeModel.destroy(options).then(numRemoved => {
      this.message("remove", ["local"], this.EntityClass.params.name, false, {query: options, numRemoved: numRemoved});
    });
  }

}
