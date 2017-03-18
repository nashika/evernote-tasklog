import _ = require("lodash");

import {BaseTable} from "./base.table";
import {BaseSingleEntity} from "../../common/entity/base-single.entity";

export abstract class BaseSingleTable<T extends BaseSingleEntity> extends BaseTable<T> {

  EntityClass: typeof BaseSingleEntity;

  get Class(): typeof BaseSingleTable {
    return <typeof BaseSingleTable>this.constructor;
  }

  async findOne(): Promise<T> {
    this.message("load", ["local"], this.EntityClass.params.name, true);
    let instance = await this.sequelizeModel.findOne({where: {id: 1}});
    this.message("load", ["local"], this.EntityClass.params.name, false, null);
    if (instance)
      return new (<any>this.EntityClass)(instance.toJSON());
    else
      return new (<any>this.EntityClass)(_.cloneDeep(this.EntityClass.params.defaultDoc));
  }

  async save(entity: T): Promise<void> {
    entity.id = 1;
    this.message("upsert", ["local"], this.EntityClass.params.name, true);
    await this.sequelizeModel.upsert(entity);
    this.message("upsert", ["local"], this.EntityClass.params.name, false);
  }

}
