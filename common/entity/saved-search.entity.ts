import { BaseEvernoteEntity } from "./base-evernote.entity";
import { IBaseEntityParams } from "./base.entity";

export class SavedSearchEntity extends BaseEvernoteEntity {
  static params: IBaseEntityParams<SavedSearchEntity> = {
    name: "savedSearch",
    primaryKey: "guid",
    displayField: "name",
    archive: false,
    default: {
      where: {},
      order: [["updated", "DESC"]],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  name: string | null = null;
  query: string | null = null;
  format: number | null = null;
  scope: Object | null = null;
}
