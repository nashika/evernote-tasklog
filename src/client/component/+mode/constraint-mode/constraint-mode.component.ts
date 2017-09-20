import Component from "vue-class-component";
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {DatastoreService} from "../../../service/datastore.service";
import {container} from "../../../inversify.config";
import {RequestService} from "../../../service/request.service";
import {ConstraintResultEntity} from "../../../../common/entity/constraint-result.entity";
import {configLoader} from "../../../../common/util/config-loader";
import {NoteEntity} from "../../../../common/entity/note.entity";
import {ProgressService} from "../../../service/progress.service";
import {i18n} from "../../../i18n";

interface IConstraintResultRecord {
  noteTitle: string;
  noteGuid: string;
  constraintId: number;
  constraintLabel: string;
}

@Component({})
export default class ConstraintModeComponent extends BaseComponent {

  requestService: RequestService = container.get(RequestService);
  datastoreService: DatastoreService = container.get(DatastoreService);
  progressService: ProgressService = container.get(ProgressService);

  records: IConstraintResultRecord[] = [];

  fields = {
    noteTitle: {label: i18n.t("common.note"), sortable: true},
    constraintLabel: {label: i18n.t("common.constraint"), sortable: true},
  };

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(): Promise<void> {
    this.progressService.open(3);
    try {
      this.progressService.next("Syncing remote server.");
      await this.requestService.sync();
      this.progressService.next("Requesting constraint result.");
      let constraintResults = await this.requestService.find(ConstraintResultEntity, {});
      let noteGuids: string[] = _(constraintResults).map(constraintResult => constraintResult.noteGuid).uniq().value();
      let noteArray = await this.requestService.find(NoteEntity, {where: {guid: noteGuids}});
      let notes: { [guid: string]: NoteEntity } = _.keyBy(noteArray, "guid");
      this.records = [];
      for (let constraintResult of constraintResults) {
        let note = notes[constraintResult.noteGuid];
        if (!note) continue;
        this.records.push({
          noteTitle: note.title,
          noteGuid: constraintResult.noteGuid,
          constraintId: constraintResult.constraintId,
          constraintLabel: _.find(configLoader.app.constraints, {id: constraintResult.constraintId}).label,
        });
      }
      this.progressService.next("Done.");
    } finally {
      this.progressService.close();
    }
  }

}
