import BaseEvernoteEntity from "./base-evernote.entity";
import { IEntityParams } from "./base.entity";

export default class NoteEntity extends BaseEvernoteEntity {
  static readonly params: IEntityParams<NoteEntity> = {
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
        type: "integer",
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
        nullable: true,
      },
      updated: {
        type: "integer",
        nullable: true,
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
        nullable: true,
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
        type: "real",
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

  title?: string;
  content?: string | null;
  contentHash?: Object;
  contentLength?: number;
  created?: number;
  updated?: number;
  deleted?: number;
  active?: boolean;
  notebookGuid?: string;
  tagGuids?: string[];
  resources?: Object[];
  attributes?: {
    subjectDate?: number;
    latitude?: number;
    longitude?: number;
    author?: string;
    source?: string;
    sourceURL?: string;
    sourceApplication?: string;
    shareDate?: number;
    reminderOrder?: number;
    reminderDoneTime?: number;
    reminderTime?: number;
    placeName?: string;
    contentClass?: string;
    applicationData?: string;
    classifications?: string;
    creatorId?: number;
    lastEditorId?: number;
    sharedWithBusiness?: boolean;
    conflictSourceNoteGuid?: string;
    noteTitleQuality?: number;
  };

  tagNames?: string[];
  sharedNotes?: Object[];
  restrictions?: any;
  limits?: any;

  hasContent?: boolean;
}
