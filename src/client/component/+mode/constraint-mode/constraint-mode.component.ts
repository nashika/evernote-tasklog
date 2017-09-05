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
    noteGuid: {label: "Note guid", sortable: true},
    constraintLabel: {label: "Constraint", sortable: true},
  };

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(): Promise<void> {
    let constraintResults = await this.requestService.find<ConstraintResultEntity>(ConstraintResultEntity, {});
    let noteGuids: string[] = _(constraintResults).map(constraintResult => constraintResult.noteGuid).uniq().value();
    let notes = await this.requestService.find<NoteEntity>(NoteEntity, {where: {guid: noteGuids}});
    this.records = [];
    for (let constraintResult of constraintResults) {
      this.records.push({
        noteGuid: constraintResult.noteGuid,
        constraintId: constraintResult.constraintId,
        constraintLabel: _.find(configLoader.app.constraints, {id: constraintResult.constraintId}).label,
      });
    }
  }

}
