import BaseEvernoteEntity from "./base-evernote.entity";
import { IEntityParams } from "./base.entity";

export default class SavedSearchEntity extends BaseEvernoteEntity {
  static readonly params: IEntityParams<SavedSearchEntity> = {
    name: "savedSearch",
    primaryKey: "guid",
    displayField: "name",
    archive: false,
    default: {
      order: { updatedAt: "DESC" },
      take: 500,
    },
    append: {},
  };

  name?: string;
  query?: string;
  format?: number;
  scope?: Object;
}
