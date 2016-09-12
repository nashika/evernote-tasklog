import _ = require("lodash");
import evernote = require("evernote");
import {getLogger} from "log4js";

import core from '../core';
import {MultiTableOptions} from "./base-multi-table";
import {NoteEntity} from "../../common/entity/note-entity";
import {MyPromise} from "../../common/util/my-promise";
import {BaseMultiEvernoteTable} from "./base-multi-evernote-table";

let logger = getLogger("system");

export interface NoteTableOptions extends MultiTableOptions {
  content?: boolean;
}

export class NoteTable extends BaseMultiEvernoteTable<NoteEntity, NoteTableOptions> {

  static PLURAL_NAME: string = 'notes';
  static TITLE_FIELD: string = 'title';
  static APPEND_QUERY: Object = {deleted: null};

  findLocal(options: NoteTableOptions): Promise<NoteEntity[]> {
    return super.find(options).then(notes => {
      if (options.content) {
        return notes;
      } else {
        return _.map(notes, (note: NoteEntity) => {
          note.hasContent = note.content != null;
          note.content = null;
          return note;
        });
      }
    });
  }

  getRemoteContent(options: NoteTableOptions): Promise<NoteEntity[]> {
    return this.find(options).then(notes => {
      let results: NoteEntity[] = [];
      return MyPromise.eachPromiseSeries(notes, (note) => {
        if (note.content || note.hasContent) {
          results.push(note);
          return Promise.resolve();
        } else {
          return this.loadRemote(note.guid).then(loadedNote => {
            results.push(loadedNote);
            // TODO: set hasContentProperty
          });
        }
      }).then(() => {
        return results;
      });
    });
  }

  loadRemote(guid: string): Promise<NoteEntity> {
    logger.debug(`Loading note from remote was started. guid=${guid}`);
    let noteStore: evernote.Evernote.NoteStoreClient = core.users[this.username].client.getNoteStore();
    let lastNote: NoteEntity = null;
    return Promise.resolve().then(() => {
      return new Promise((resolve, reject) => {
        noteStore.getNote(guid, true, false, false, false, (err, note) => {
          if (err) return reject(err);
          resolve(new NoteEntity(note));
        });
      });
    }).then((note: NoteEntity) => {
      return new Promise((resolve, reject) => {
        logger.debug(`Loading note was succeed. guid=${note.guid} title=${note.title}`);
        lastNote = note;
        logger.debug(`Saving note to local. guid=${note.guid}`);
        this.datastore.update({guid: note.guid}, note, {upsert: true}, (err, numReplaced) => {
          if (err) return reject(err);
          resolve(numReplaced);
        });
      });
    }).then((numReplaced: number) => {
      logger.debug(`Saving note was succeed. guid=${lastNote.guid} numReplaced=${numReplaced}`);
      return this._parseNote(lastNote);
    }).then(() => {
      logger.debug(`Loading note from remote was finished. note is loaded. guid=${lastNote.guid} title=${lastNote.title}`);
      return lastNote;
    });
  }

  reParseNotes(options: NoteTableOptions): Promise<void> {
    if (!options) options = {};
    options.limit = 0;
    options.content = true;
    return this.find(options).then(notes => {
      return MyPromise.eachPromiseSeries(notes, note => {
        return this._parseNote(note);
      });
    });
  }

  protected _parseNote(note: NoteEntity): Promise<void> {
    if (!note.content) return Promise.resolve();
    logger.debug(`Parsing note was started. guid=${note.guid}, title=${note.title}`);
    let content: string = note.content;
    content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>');
    let lines: string[] = [];
    for (var line of content.split('<>')) {
      lines.push(line.replace(/<[^>]*>/g, ''));
    }
    return Promise.resolve().then(() => {
      return core.users[this.username].models.timeLogs.parse(note, lines);
    }).then(() => {
      return core.users[this.username].models.profitLogs.parse(note, lines);
    }).then(() => {
      logger.debug(`Parsing note was succeed. guid=${note.guid}`);
    });
  }

}
