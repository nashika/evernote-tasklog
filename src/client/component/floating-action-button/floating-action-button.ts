import Component from "vue-class-component";

import BaseComponent from "../base.component";

@Component({
  props: {
    enableReload: Boolean,
    enableFilter: Boolean,
  },
})
export default class FloatingActionButtonComponent extends BaseComponent {

  enableReload: boolean;
  enableFilter: boolean;

}
