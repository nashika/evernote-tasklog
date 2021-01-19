import { BaseEvernoteEntity } from "./base-evernote.entity";
import { EntityParams } from "./base.entity";

export class SavedSearchEntity extends BaseEvernoteEntity {
  FIELD_NAMES!:
    | "name"
    | "query"
    | "format"
    | "scope"
    | BaseEvernoteEntity["FIELD_NAMES3"];

  static readonly params: EntityParams<SavedSearchEntity> = {
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

  name!: string;
  query!: string | null;
  format!: number | null;
  scope!: Object | null;
}
