import Component from "vue-class-component";

import BaseComponent from "../../base.component";

@Component({})
export default class AttendanceModeComponent extends BaseComponent {

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(): Promise<void> {
  }

}
