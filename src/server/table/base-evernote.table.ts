import { injectable } from "inversify";

import { BaseTable } from "./base.table";
import { BaseEvernoteEntity } from "~/src/common/entity/base-evernote.entity";

@injectable()
export class BaseEvernoteTable<
  T extends BaseEvernoteEntity
> extends BaseTable<T> {}
