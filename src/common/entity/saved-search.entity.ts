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
    columns: {
      guid: {
        type: "string",
        primary: true,
        nullable: false,
      },
      name: {
        type: "string",
        nullable: false,
      },
      query: {
        type: "string",
        nullable: true,
      },
      format: {
        type: "integer",
        nullable: true,
      },
      updateSequenceNum: {
        type: "integer",
        nullable: false,
      },
      scope: {
        type: "text",
        nullable: true,
      },
    },
    jsonFields: ["scope"],
  };

  name?: string;
  query?: string;
  format?: number;
  scope?: Object;
}
