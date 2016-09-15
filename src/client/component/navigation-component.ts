import Component from "vue-class-component";
import _ = require("lodash");

import {BaseComponent} from "./base-component";

let template = require("./navigation-component.jade");

@Component({
  template: template,
  components: {},
  props: {
    mode: {
      type: String,
      required: true,
      twoWay: true,
    },
  },
})
export class NavigationComponent extends BaseComponent {

  mode: string;

  navCollapse: boolean;

  data(): any {
    return _.assign(super.data(), {
      navCollapse: true,
    });
  }

  reload() {
    this.navCollapse = true;
    this.$parent.$broadcast("reload");
  }

}
