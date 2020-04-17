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
      },
      title: {
        type: "string",
        nullable: false,
      },
      content: {
        type: "text",
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
      },
      updated: {
        type: "integer",
      },
      deleted: {
        type: "integer",
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
      },
      tagGuids: {
        type: "text",
      },
      resources: {
        type: "text",
      },
      attributes__subjectDate: {
        type: "real",
      },
      attributes__latitude: {
        type: "real",
      },
      attributes__longitude: {
        type: "real",
      },
      attributes__altitude: {
        type: "real",
      },
      attributes__author: {
        type: "string",
      },
      attributes__source: {
        type: "string",
      },
      attributes__sourceURL: {
        type: "string",
      },
      attributes__sourceApplication: {
        type: "string",
      },
      attributes__shareDate: {
        type: "integer",
      },
      attributes__reminderOrder: {
        type: "integer",
      },
      attributes__reminderDoneTime: {
        type: "integer",
      },
      attributes__reminderTime: {
        type: "integer",
      },
      attributes__placeName: {
        type: "string",
      },
      attributes__contentClass: {
        type: "string",
      },
      attributes__applicationData: {
        type: "text",
      },
      attributes__classifications: {
        type: "text",
      },
      attributes__creatorId: {
        type: "integer",
      },
      attributes__lastEditorId: {
        type: "integer",
      },
      attributes__sharedWithBusiness: {
        type: "boolean",
      },
      attributes__conflictSourceNoteGuid: {
        type: "string",
      },
      attributes__noteTitleQuality: {
        type: "integer",
      },
      tagNames: {
        type: "text",
      },
      sharedNotes: {
        type: "text",
      },
      restrictions: {
        type: "text",
      },
      limits: {
        type: "text",
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
