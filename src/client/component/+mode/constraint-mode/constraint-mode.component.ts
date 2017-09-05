import Component from "vue-class-component";
import * as _ from "lodash";

import BaseComponent from "../../base.component";
import {DatastoreService} from "../../../service/datastore.service";
import {container} from "../../../inversify.config";
import {RequestService} from "../../../service/request.service";
import {ConstraintResultEntity} from "../../../../common/entity/constraint-result.entity";
import {configLoader} from "../../../../common/util/config-loader";
import {NoteEntity} from "../../../../common/entity/note.entity";

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

  records: IConstraintResultRecord[] = [];

  fields = {
    noteTitle: {label: "Note", sortable: true},
    constraintLabel: {label: "Constraint", sortable: true},
  };

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(): Promise<void> {
    let constraintResults = await this.requestService.find<ConstraintResultEntity>(ConstraintResultEntity, {});
    let noteGuids: string[] = _(constraintResults).map(constraintResult => constraintResult.noteGuid).uniq().value();
    let noteArray = await this.requestService.find<NoteEntity>(NoteEntity, {where: {guid: noteGuids}});
    let notes: {[guid: string]: NoteEntity} = _.keyBy(noteArray, "guid");
    this.records = [];
    for (let constraintResult of constraintResults) {
      this.records.push({
        noteTitle: notes[constraintResult.noteGuid].title,
        noteGuid: constraintResult.noteGuid,
        constraintId: constraintResult.constraintId,
        constraintLabel: _.find(configLoader.app.constraints, {id: constraintResult.constraintId}).label,
      });
    }
  }

}
