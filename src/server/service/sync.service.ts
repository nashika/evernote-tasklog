import evernote = require("evernote");
import _ = require("lodash");
import {injectable} from "inversify";

import {TableService} from "./table.service";
import {EvernoteClientService} from "./evernote-client.service";
import {NoteTable} from "../table/note.table";
import {NoteEntity} from "../../common/entity/note.entity";
import {NotebookTable} from "../table/notebook.table";
import {LinkedNotebookEntity} from "../../common/entity/linked-notebook.entity";
import {LinkedNotebookTable} from "../table/linked-notebook.table";
import {SavedSearchEntity} from "../../common/entity/saved-search.entity";
import {SavedSearchTable} from "../table/saved-search.table";
import {TagEntity} from "../../common/entity/tag.entity";
import {TagTable} from "../table/tag.table";
import {NotebookEntity} from "../../common/entity/notebook.entity";
import {BaseServerService} from "./base-server.service";
import {OptionTable} from "../table/option.table";
import {OptionEntity} from "../../common/entity/option.entity";
import {logger} from "../logger";

@injectable()
export class SyncService extends BaseServerService {

  private static startInterval = 5 * 1000;
  private static maxInterval = 5 * 60 * 1000;

  public updateCount: number = 0;

  private timer: any;
  private interval: number;

  constructor(protected tableService: TableService,
              protected evernoteClientService: EvernoteClientService) {
    super();
  }

  get Class(): typeof SyncService {
    return <typeof SyncService>this.constructor;
  }

  async sync(manual: boolean): Promise<void> {
    clearTimeout(this.timer);
    let optionTable = this.tableService.getTable<OptionTable>(OptionEntity);
    let localSyncState: evernote.Evernote.SyncState = await optionTable.findValueByKey("syncState");
    if (!localSyncState) localSyncState = <any>{updateCount: 0};
    let remoteSyncState = await this.evernoteClientService.getSyncState();
    // Sync process
    logger.info(`Sync start. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
    while (localSyncState.updateCount < remoteSyncState.updateCount) {
      await this.getSyncChunk(localSyncState);
    }
    await optionTable.saveValueByKey("syncState", remoteSyncState);
    logger.info(`Sync end. localUSN=${localSyncState.updateCount} remoteUSN=${remoteSyncState.updateCount}`);
    this.updateCount = localSyncState.updateCount;
    this.interval = manual ? this.Class.startInterval : Math.min(Math.round(this.interval * 1.5), this.Class.maxInterval);
    this.timer = setTimeout(() => this.sync(false).catch(err => logger.error(err)), this.interval);
    logger.info(`Next auto reload will run after ${this.interval} msec.`);
    if (!manual) await this.autoGetNoteContent(this.interval);
  }

  private async getSyncChunk(localSyncState: evernote.Evernote.SyncState): Promise<void> {
    logger.info(`Get sync chunk start. startUSN=${localSyncState.updateCount}`);
    let optionTable = this.tableService.getTable<OptionTable>(OptionEntity);
    let noteTable = this.tableService.getTable<NoteTable>(NoteEntity);
    let notebookTable = this.tableService.getTable<NotebookTable>(NotebookEntity);
    let tagTable = this.tableService.getTable<TagTable>(TagEntity);
    let savedSearchTable = this.tableService.getTable<SavedSearchTable>(SavedSearchEntity);
    let linkedNotebookTable = this.tableService.getTable<LinkedNotebookTable>(LinkedNotebookEntity);
    let lastSyncChunk: evernote.Evernote.SyncChunk = await this.evernoteClientService.getFilteredSyncChunk(localSyncState.updateCount);
    await noteTable.saveAll(_.map(lastSyncChunk.notes, note => new NoteEntity(note)));
    await noteTable.removeByGuid(lastSyncChunk.expungedNotes);
    await notebookTable.saveAll(_.map(lastSyncChunk.notebooks, notebook => new NotebookEntity(notebook)));
    await notebookTable.removeByGuid(lastSyncChunk.expungedNotebooks);
    await tagTable.saveAll(_.map(lastSyncChunk.tags, tag => new TagEntity(tag)));
    await tagTable.removeByGuid(lastSyncChunk.expungedTags);
    await savedSearchTable.saveAll(_.map(lastSyncChunk.searches, search => new SavedSearchEntity(search)));
    await savedSearchTable.removeByGuid(lastSyncChunk.expungedSearches);
    await linkedNotebookTable.saveAll(_.map(lastSyncChunk.linkedNotebooks, linkedNotebook => new LinkedNotebookEntity(linkedNotebook)));
    await linkedNotebookTable.removeByGuid(lastSyncChunk.expungedLinkedNotebooks);
    localSyncState.updateCount = lastSyncChunk.chunkHighUSN;
    await optionTable.saveValueByKey("syncState", localSyncState);
    logger.info(`Get sync chunk end. endUSN=${localSyncState.updateCount}`);
  }

  private async autoGetNoteContent(interval: number): Promise<void> {
    let numNote: number = Math.ceil(interval / (60 * 1000));
    let noteTable = this.tableService.getTable<NoteTable>(NoteEntity);
    logger.info(`Auto get note content was started. Number of note is ${numNote}.`);
    let notes = await noteTable.findAll({where: {content: null}, order: [["updated", "DESC"]], limit: numNote});
    for (let note of notes) {
      await noteTable.loadRemote(note.guid);
    }
    logger.info(`Auto get note content was finished.`);
  }

}
