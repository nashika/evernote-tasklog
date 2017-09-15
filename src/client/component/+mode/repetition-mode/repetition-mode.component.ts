import Component from "vue-class-component";

import BaseComponent from "../../base.component";
import {container} from "../../../inversify.config";
import {DatastoreService} from "../../../service/datastore.service";
import {RequestService} from "../../../service/request.service";
import {i18n} from "../../../i18n";
import {ProgressService} from "../../../service/progress.service";

interface IRepetitionRecord {
  noteTitle: string;
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
    noteTitle: {label: i18n.t("common.note"), sortable: true},
    constraintLabel: {label: i18n.t("common.constraint"), sortable: true},
    action: {label: i18n.t("common.action")},
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
      this.progressService.next("Done.");
    } finally {
      this.progressService.close();
    }
  }

}
