import BaseEvernoteCEntity from "./base-evernote.c-entity";
import { IBaseCEntityParams } from "./base.c-entity";

export default class SavedSearchCEntity extends BaseEvernoteCEntity {
  static params: IBaseCEntityParams<SavedSearchCEntity> = {
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
