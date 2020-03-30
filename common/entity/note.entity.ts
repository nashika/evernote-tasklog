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
  } = {
    subjectDate: null,
    latitude: null,
    longitude: null,
    author: null,
    sourceURL: null,
    sourceApplication: null,
    shareDate: null,
    reminderOrder: null,
    reminderDoneTime: null,
    placeName: null,
    contentClass: null,
    applicationData: null,
    classifications: null,
    creatorId: null,
    lastEditorId: null,
    sharedWithBusiness: null,
    conflictSourceNoteGuid: null,
    noteTitleQuality: null,
  };

  tagNames: string[] | null = null;
  sharedNotes: Object[] | null = null;
  restrictions: any;
  limits: any;

  hasContent: boolean | null = null;
}
