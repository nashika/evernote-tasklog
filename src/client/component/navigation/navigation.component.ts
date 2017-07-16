import Component from "vue-class-component";

import BaseComponent from "../base.component";
import {DatastoreService} from "../../service/datastore.service";
import {container} from "../../inversify.config";

@Component({})
export default class NavigationComponent extends BaseComponent {

  datastoreService: DatastoreService = container.get(DatastoreService);

  get personLabel(): string {
    if (this.datastoreService.$vm.currentPersonId)
      return this.datastoreService.currentPerson.name.substr(0, 1);
    else
      return "Person";
  }

}
