import Vue from "vue";
import _ from "lodash";
import moment from "moment";
import numeral from "numeral";
import VueI18n from "vue-i18n";

import logger from "~/src/client/plugins/logger";

export default abstract class BaseComponent extends Vue {
  lodash = _;
  moment = moment;
  numeral = numeral;
  logger = logger;

  $ts(key: VueI18n.Path, values?: VueI18n.Values): string {
    const result = this.$t(key, values);
    if (typeof result === "string") return result;
    else return result.toString();
  }

  async created(): Promise<void> {}

  async mounted(): Promise<void> {}
}
