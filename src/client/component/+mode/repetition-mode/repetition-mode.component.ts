import Component from "vue-class-component";
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {container} from "../../../inversify.config";
import {DatastoreService} from "../../../service/datastore.service";
import {RequestService} from "../../../service/request.service";
import {i18n} from "../../../i18n";
import {ProgressService} from "../../../service/progress.service";
import {configLoader} from "../../../../common/util/config-loader";
import {NoteEntity} from "../../../../common/entity/note.entity";

interface IRepetitionRecord {
  id: number;
  label: string;
  noteGuid: string;
}

@Component({})
export default class RepetitionModeComponent extends BaseComponent {

  requestService: RequestService = container.get(RequestService);
  datastoreService: DatastoreService = container.get(DatastoreService);
  progressService: ProgressService = container.get(ProgressService);

  records: IRepetitionRecord[] = [];

  fields = {
    id: {label: "ID", sortable: true},
    label: {label: i18n.t("common.title"), sortable: true},
    noteGuid: {label: "guid"},
    action: {label: i18n.t("common.action")},
  };

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(): Promise<void> {
    this.progressService.open(2);
    try {
      this.progressService.next("Syncing remote server.");
      await this.requestService.sync();
      this.records = configLoader.app.repetitions.map(repetition =>
        ({id: repetition.id, label: repetition.label, noteGuid: repetition.noteGuid}));
      this.progressService.next("Done.");
    } finally {
      this.progressService.close();
    }
  }

  async createNote(record: IRepetitionRecord): Promise<void> {
    this.progressService.open(3);
    try {
      this.progressService.next("Getting note data.");
      let note = await this.requestService.findOne<NoteEntity>(NoteEntity, {where: {guid: record.noteGuid}});
      this.progressService.next("Creating new note.");
      let newNote = _.cloneDeep(note);
      newNote.guid = null;
      let createdNote = await this.requestService.save<NoteEntity>(NoteEntity, newNote);
      console.log(createdNote);
      debugger;
    } finally {
      this.progressService.close();
    }
  }

}
