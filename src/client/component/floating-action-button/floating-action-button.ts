import Component from "vue-class-component";

import BaseComponent from "../base.component";
import {IDatastoreServiceNoteFilterParams} from "../../service/datastore.service";

@Component({
  props: {
    enableReload: [Boolean, String],
    enableFilter: [Boolean, String],
    filterParams: Object,
  },
})
export default class FloatingActionButtonComponent extends BaseComponent {

  enableReload: boolean;
  enableFilter: boolean;
  filterParams: IDatastoreServiceNoteFilterParams;

  async mounted(): Promise<void> {
    await super.mounted();
    this.$root.$on("filter-modal::change", (param: IDatastoreServiceNoteFilterParams) => this.hideFilterModal(param))
  }

  showFilterModal() {
    this.$root.$emit('show::modal', 'filter-modal');
  }

  hideFilterModal(param: IDatastoreServiceNoteFilterParams) {
    this.$emit("changeFilter", param);
  }

}
