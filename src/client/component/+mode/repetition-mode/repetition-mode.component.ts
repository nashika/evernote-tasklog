import Component from "vue-class-component";
import * as _ from "lodash";
import * as moment from "moment";

import BaseComponent from "../../base.component";
import {container} from "../../../inversify.config";
import {DatastoreService} from "../../../service/datastore.service";
import {RequestService} from "../../../service/request.service";
import {i18n} from "../../../i18n";
import {ProgressService} from "../../../service/progress.service";
import {configLoader} from "../../../../common/util/config-loader";
import {IFindNoteEntityOptions, NoteEntity} from "../../../../common/entity/note.entity";

interface IRepetitionRecord {
  id: number;
  label: string;
  repetition: config.IRepetitionConfig;
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
        ({id: repetition.id, label: repetition.label, repetition: repetition}));
      this.progressService.next("Done.");
    } finally {
      this.progressService.close();
    }
  }

  async createNote(record: IRepetitionRecord): Promise<void> {
    this.progressService.open(3);
    try {
      this.progressService.next("Getting note data.");
      let note = await this.requestService.findOne(NoteEntity, <IFindNoteEntityOptions>{where: {guid: record.repetition.noteGuid}, includeContent: true});
      this.progressService.next("Creating new note.");
      let newNote = _.cloneDeep(note);
      newNote.guid = null;
      newNote.title = moment().format(record.repetition.title);
      let destNotebook = _.find(this.datastoreService.$vm.notebooks, {name: record.repetition.destNotebook});
      if (destNotebook)
        newNote.notebookGuid = destNotebook.guid;
      newNote.created = null;
      console.log(newNote);
      let createdNote = await this.requestService.saveRemoteNote(newNote);
      console.log(createdNote);
    } finally {
      this.progressService.close();
    }
  }

}
