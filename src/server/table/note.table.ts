import { injectable } from "inversify";
import _ from "lodash";

import { TableService } from "~/src/server/service/table.service";
import {
  IFindManyNoteEntityOptions,
  NoteEntity,
} from "~/src/common/entity/note.entity";
import { BaseEvernoteTable } from "~/src/server/table/base-evernote.table";
import { logger } from "~/src/common/logger";
import { EvernoteClientService } from "~/src/server/service/evernote-client.service";
import { FindEntityWhereOptions } from "~/src/common/entity/base.entity";

@injectable()
export class NoteTable extends BaseEvernoteTable<NoteEntity> {
  constructor(
    protected tableService: TableService,
    protected evernoteClientService: EvernoteClientService
  ) {
    super();
  }

  async findAll(options: IFindManyNoteEntityOptions): Promise<NoteEntity[]> {
    const notes = await super.findAll(options);
    if (options.includeContent) {
      return notes;
    } else {
      return _.map(notes, (note: NoteEntity) => {
        note.hasContent = note.content != null;
        note.content = null;
        return note;
      });
    }
  }

  protected prepareSaveEntity(entity: NoteEntity): any {
    _.each(entity.attributes || {}, (value, key) => {
      _.set(entity, `attributes__${key}`, value);
    });
    delete entity.attributes;
    return super.prepareSaveEntity(entity);
  }

  protected prepareLoadEntity(data: Partial<NoteEntity>): NoteEntity {
    const entity = super.prepareLoadEntity(data);
    _(_.keys(entity))
      .filter((key) => _.includes(key, "__"))
      .each((key) => {
        _.set(entity, key.replace("__", "."), _.get(entity, key));
        _.unset(entity, key);
      });
    return entity;
  }

  async loadRemote(guid: string): Promise<NoteEntity> {
    this.message("load", ["remote"], "note", true, { guid });
    const note = await this.evernoteClientService.getNote(guid);
    const lastNote: NoteEntity = note;
    await this.save(note, true);
    await this.parseNote(lastNote);
    this.message("load", ["remote"], "note", false, {
      guid: lastNote.guid,
      title: lastNote.title,
    });
    return lastNote;
  }

  async reParseNotes(
    query: FindEntityWhereOptions<NoteEntity> = {}
  ): Promise<void> {
    const options: IFindManyNoteEntityOptions = {};
    options.where = query;
    options.take = -1;
    options.includeContent = true;
    const notes = await this.findAll(options);
    let i = 1;
    for (const note of notes) {
      if (i % 100 === 0) logger.info(`parsing notes... ${i} / ${notes.length}`);
      await this.parseNote(note);
      i++;
    }
  }

  private async parseNote(note: NoteEntity): Promise<void> {
    if (!note.content) return;
    this.message("parse", ["local"], "note", true, {
      guid: note.guid,
      title: note.title,
    });
    let content: string = note.content;
    content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, "<>");
    const lines: string[] = [];
    for (const line of content.split("<>")) {
      lines.push(line.replace(/<[^>]*>/g, ""));
    }
    await this.tableService.timeLogTable.parse(note, lines);
    await this.tableService.profitLogTable.parse(note, lines);
    this.message("parse", ["local"], "note", false, {
      guid: note.guid,
      title: note.title,
    });
  }
}
