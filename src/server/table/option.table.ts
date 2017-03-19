import {injectable} from "inversify";
import sequelize = require("sequelize");

import {OptionEntity} from "../../common/entity/option.entity";
import {IBaseTableParams, BaseTable} from "./base.table";

@injectable()
export class OptionTable extends BaseTable<OptionEntity> {

  static params: IBaseTableParams = {
    fields: {
      key: {type: sequelize.STRING, primaryKey: true},
      value: {type: sequelize.TEXT},
    }, options: {
      indexes: [],
    },
    jsonFields: ["value"],
  };

  async findValueByKey(key: string): Promise<any> {
    return (await this.findByPrimary(key)).value;
  }

  async saveValueByKey(key: string, value: any): Promise<void> {
    let optionEntity = new OptionEntity({key: key, value: value});
    await this.save(optionEntity);
  }

}
