import { injectable } from "inversify";

import BaseTable from "~/src/server/table/base.table";
import OptionEntity from "~/src/common/entity/option.entity";

@injectable()
export class OptionTable extends BaseTable<OptionEntity> {
  async findValueByKey(key: string): Promise<any> {
    const entity = await this.findByPrimary(key);
    return entity ? entity.value : null;
  }

  async saveValueByKey(key: string, value: any): Promise<void> {
    const optionEntity = new OptionEntity({ key, value });
    await this.save(optionEntity);
  }
}
