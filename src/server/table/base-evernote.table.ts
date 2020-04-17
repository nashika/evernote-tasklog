import { injectable } from "inversify";

import BaseTable from "./base.table";
import BaseEvernoteEntity from "~/src/common/entity/base-evernote.entity";

@injectable()
export default class BaseEvernoteTable<
  T extends BaseEvernoteEntity
> extends BaseTable<T> {
  async removeByGuid(guid: string | string[]): Promise<void> {
    await this.repository.delete(guid);
  }
}
