import BaseEvernoteEntity from "./base-evernote.entity";
import { EntityParams, FindManyEntityOptions } from "./base.entity";

export default class NoteEntity extends BaseEvernoteEntity {
  FIELD_NAMES!:
    | "title"
    | "content"
    | "contentHash"
    | "contentLength"
    | "created"
    | "updated"
    | "deleted"
    | "active"
    | "notebookGuid"
    | "tagGuids"
    | "resources"
    | "attributes"
    | "tagNames"
    | "sharedNotes"
    | "restrictions"
    | "limits"
    | "hasContent"
    | BaseEvernoteEntity["FIELD_NAMES3"];

  static readonly params: EntityParams<NoteEntity> = {
    name: "note",
    primaryKey: "guid",
    displayField: "title",
    archive: true,
    default: {
      order: { updatedAt: "DESC", updateSequenceNum: "DESC" },
      take: 500,
    },
    append: {
      where: { deleted: null },
    },
    columns: {
      guid: {
        type: "string",
        primary: true,
        nullable: false,
      },
      title: {
        type: "string",
        nullable: false,
      },
      content: {
        type: "text",
        nullable: true,
      },
      contentHash: {
        type: "text",
        nullable: false,
      },
      contentLength: {
        type: "integer",
        nullable: false,
      },
      created: {
        type: "integer",
        nullable: false,
      },
      updated: {
        type: "integer",
        nullable: false,
      },
      deleted: {
        type: "integer",
        nullable: true,
      },
      active: {
        type: "boolean",
        nullable: false,
      },
      updateSequenceNum: {
        type: "integer",
        nullable: false,
      },
      notebookGuid: {
        type: "string",
        nullable: false,
      },
      tagGuids: {
        type: "text",
        nullable: true,
      },
      resources: {
        type: "text",
        nullable: true,
      },
      attributes__subjectDate: {
        type: "integer",
        nullable: true,
      },
      attributes__latitude: {
        type: "real",
        nullable: true,
      },
      attributes__longitude: {
        type: "real",
        nullable: true,
      },
      attributes__altitude: {
        type: "real",
        nullable: true,
      },
      attributes__author: {
        type: "string",
        nullable: true,
      },
      attributes__source: {
        type: "string",
        nullable: true,
      },
      attributes__sourceURL: {
        type: "string",
        nullable: true,
      },
      attributes__sourceApplication: {
        type: "string",
        nullable: true,
      },
      attributes__shareDate: {
        type: "integer",
        nullable: true,
      },
      attributes__reminderOrder: {
        type: "integer",
        nullable: true,
      },
      attributes__reminderDoneTime: {
        type: "integer",
        nullable: true,
      },
      attributes__reminderTime: {
        type: "integer",
        nullable: true,
      },
      attributes__placeName: {
        type: "string",
        nullable: true,
      },
      attributes__contentClass: {
        type: "string",
        nullable: true,
      },
      attributes__applicationData: {
        type: "text",
        nullable: true,
      },
      attributes__classifications: {
        type: "text",
        nullable: true,
      },
      attributes__creatorId: {
        type: "integer",
        nullable: true,
      },
      attributes__lastEditorId: {
        type: "integer",
        nullable: true,
      },
      attributes__sharedWithBusiness: {
        type: "boolean",
        nullable: true,
      },
      attributes__conflictSourceNoteGuid: {
        type: "string",
        nullable: true,
      },
      attributes__noteTitleQuality: {
        type: "integer",
        nullable: true,
      },
      tagNames: {
        type: "text",
        nullable: true,
      },
      sharedNotes: {
        type: "text",
        nullable: true,
      },
      restrictions: {
        type: "text",
        nullable: true,
      },
      limits: {
        type: "text",
        nullable: true,
      },
    },
    jsonFields: [
      "contentHash",
      "tagGuids",
      "resources",
      "attributes__applicationData",
      "tagNames",
      "sharedNotes",
      "restrictions",
      "limits",
    ],
  };

  title!: string;
  content!: string | null;
  contentHash!: Object;
  contentLength!: number;
  created!: number;
  updated!: number;
  deleted!: number | null;
  active!: boolean;
  notebookGuid!: string;
  tagGuids!: string[] | null;
  resources!: Object[] | null;
  attributes?: {
    subjectDate: number | null;
    latitude: number | null;
    longitude: number | null;
    author: string | null;
    source: string | null;
    sourceURL: string | null;
    sourceApplication: string | null;
    shareDate: number | null;
    reminderOrder: number | null;
    reminderDoneTime: number | null;
    reminderTime: number | null;
    placeName: string | null;
    contentClass: string | null;
    applicationData: string | null;
    classifications: string | null;
    creatorId: number | null;
    lastEditorId: number | null;
    sharedWithBusiness: boolean | null;
    conflictSourceNoteGuid: string | null;
    noteTitleQuality: number | null;
  };

  tagNames!: string[] | null;
  sharedNotes!: Object[] | null;
  restrictions!: any | null;
  limits!: any | null;

  hasContent!: boolean;
}

export interface IFindManyNoteEntityOptions
  extends FindManyEntityOptions<NoteEntity> {
  includeContent?: boolean;
}
