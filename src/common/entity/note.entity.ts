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
  };

  title?: string;
  content?: string;
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
