import Component from "vue-class-component";

import BaseComponent from "../../base.component";
import {configLoader, IPersonConfig} from "../../../../common/util/config-loader";
import {DatastoreService} from "../../../service/datastore.service";
import {container} from "../../../inversify.config";
import {RequestService} from "../../../service/request.service";

@Component({})
export default class PersonModalComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);
  requestService: RequestService = container.get(RequestService);

  persons: IPersonConfig[] = configLoader.app.persons;
  currentPersonId: number = 0;
  changed: boolean = false;

  fields = {
    id: {label: "ID", sortable: true},
    name: {label: "Name", sortable: true},
    action: {label: "Action"},
  };

  async shown(): Promise<void> {
    this.currentPersonId = this.datastoreService.$vm.currentPersonId;
  }

  async hidden(): Promise<void> {
    if (this.changed)
      this.$root.reload();
    this.changed = false;
  }

  async select(id: number): Promise<void> {
    this.currentPersonId = id;
    this.datastoreService.$vm.currentPersonId = id;
    this.changed = true;
    await this.requestService.saveSession("currentPersonId", id);
  }

}
