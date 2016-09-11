import _ = require("lodash");
import evernote = require("evernote");

import core from '../core';
import {MultiTableOptions} from "./base-multi-table";
import {BaseMultiTable} from "./base-multi-table";
import {NoteEntity} from "../../common/entity/note-entity";
import {MyPromise} from "../../common/util/my-promise";

export interface NoteTableOptions extends MultiTableOptions {
  content?: boolean;
}

export class NoteTable extends BaseMultiTable<NoteEntity, NoteTableOptions> {

  static PLURAL_NAME: string = 'notes';
  static TITLE_FIELD: string = 'title';
  static APPEND_QUERY: Object = {deleted: null};

  findLocal(options: NoteTableOptions): Promise<NoteEntity[]> {
    return super.findLocal(options).then(notes => {
      if (options.content) {
        return notes;
      } else {
        let results: NoteEntity[] = [];
        for (var note of notes) {
          let result: NoteEntity = _.cloneDeep(note);
          result.hasContent = result.content != null;
          result.content = null;
          results.push(result);
        }
        return results;
      }
    });
  }

  getRemoteContent(options: NoteTableOptions): Promise<NoteEntity[]> {
    return this.findLocal(options).then(notes => {
      let results: NoteEntity[] = [];
      return MyPromise.eachFunctionSeries(notes, (resolve, reject, note) => {
        if (note.content || note.hasContent) {
          results.push(note);
          resolve();
        } else {
          this.loadRemote(note.guid).then(loadedNote => {
            results.push(loadedNote);
            // TODO: set hasContentProperty
            resolve();
          });
        }
      }).then(() => {
        return results;
      });
    });
  }

  loadRemote(guid: string): Promise<NoteEntity> {
    core.loggers.system.debug(`Loading note from remote was started. guid=${guid}`);
    let noteStore: evernote.Evernote.NoteStoreClient = core.users[this._username].client.getNoteStore();
    let lastNote: NoteEntity = null;
    return Promise.resolve().then(() => {
      return new Promise((resolve, reject) => {
        noteStore.getNote(guid, true, false, false, false, (err: any, note: NoteEntity) => {
          if (err) return reject(err);
          resolve(note);
        });
      });
    }).then((note: NoteEntity) => {
      return new Promise((resolve, reject) => {
        core.loggers.system.debug(`Loading note was succeed. guid=${note.guid} title=${note.title}`);
        lastNote = note;
        core.loggers.system.debug(`Saving note to local. guid=${note.guid}`);
        this._datastore.update({guid: note.guid}, note, {upsert: true}, (err: Error, numReplaced: number) => {
          if (err) return reject(err);
          resolve(numReplaced);
        });
      });
    }).then((numReplaced: number) => {
      core.loggers.system.debug(`Saving note was succeed. guid=${lastNote.guid} numReplaced=${numReplaced}`);
      return this._parseNote(lastNote);
    }).then(() => {
      core.loggers.system.debug(`Loading note from remote was finished. note is loaded. guid=${lastNote.guid} title=${lastNote.title}`);
      return lastNote;
    });
  }

  reParseNotes(options: NoteTableOptions): Promise<void> {
    if (!options) options = {};
    options.limit = 0;
    options.content = true;
    return this.findLocal(options).then(notes => {
      return MyPromise.eachPromiseSeries(notes, note => {
        return this._parseNote(note);
      });
    });
  }

  protected _parseNote(note: NoteEntity): Promise<void> {
    if (!note.content) return Promise.resolve();
    core.loggers.system.debug(`Parsing note was started. guid=${note.guid}, title=${note.title}`);
    let content: string = note.content;
    content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>');
    let lines: string[] = [];
    for (var line of content.split('<>')) {
      lines.push(line.replace(/<[^>]*>/g, ''));
    }
    return Promise.resolve().then(() => {
      return core.users[this._username].models.timeLogs.parse(note, lines);
    }).then(() => {
      return core.users[this._username].models.profitLogs.parse(note, lines);
    }).then(() => {
      core.loggers.system.debug(`Parsing note was succeed. guid=${note.guid}`);
    });
  }

}
