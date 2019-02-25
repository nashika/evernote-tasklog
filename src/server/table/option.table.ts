import {injectable} from "inversify";
import sequelize = require("sequelize");

import {OptionEntity} from "../../common/entity/option.entity";
import {IBaseTableParams, BaseTable} from "./base.table";

@injectable()
export class OptionTable extends BaseTable<OptionEntity> {

  params: IBaseTableParams<OptionEntity> = {
    fields: {
      key: {type: sequelize.STRING, primaryKey: true},
      value: {type: sequelize.TEXT},
    }, options: {
      indexes: [],
    },
    jsonFields: ["value"],
  };

  async findValueByKey(key: string): Promise<any> {
    let entity = await this.findByPrimary(key);
    return entity ? entity.value : null;
  }

  async saveValueByKey(key: string, value: any): Promise<void> {
    let optionEntity = new OptionEntity({key: key, value: value});
    await this.save(optionEntity);
  }

}
