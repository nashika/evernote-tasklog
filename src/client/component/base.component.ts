import Vue = require("vue");
import _ = require("lodash");
import {LoDashStatic} from "lodash";

export class BaseComponent extends Vue {

  lodash: LoDashStatic;

  data(): any {
    return {
      lodash: _,
    };
  }

  ready(): Promise<void> {
    return Promise.resolve();
  }

}
