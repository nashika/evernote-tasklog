import { BaseEvernoteEntity } from "./base-evernote.entity";
import { IBaseEntityParams } from "./base.entity";

export class NoteEntity extends BaseEvernoteEntity {
  static params: IBaseEntityParams<NoteEntity> = {
    name: "note",
    primaryKey: "guid",
    displayField: "title",
    archive: true,
    default: {
      where: {},
      order: [
        ["updated", "DESC"],
        ["updateSequenceNum", "DESC"],
      ],
      limit: 500,
    },
    append: {
      where: { deleted: null },
    },
  };

  title: string | null = null;
  content: string | null = null;
  contentHash: Object | null = null;
  contentLength: number | null = null;
  created: number | null = null;
  updated: number | null = null;
  deleted: number | null = null;
  active: boolean | null = null;
  notebookGuid: string | null = null;
  tagGuids: string[] | null = null;
  resources: Object[] | null = null;
  attributes: {
    subjectDate: number;
    latitude: number;
    longitude: number;
    author: string;
    source: string;
    sourceURL: string;
    sourceApplication: string;
    shareDate: number;
    reminderOrder: number;
    reminderDoneTime: number;
    reminderTime: number;
    placeName: string;
    contentClass: string;
    applicationData: string;
    classifications: string;
    creatorId: number;
    lastEditorId: number;
    sharedWithBusiness: boolean;
    conflictSourceNoteGuid: string;
    noteTitleQuality: number;
  } | null = null;

  tagNames: string[] | null = null;
  sharedNotes: Object[] | null = null;
  restrictions: any;
  limits: any;

  hasContent: boolean | null = null;
}
