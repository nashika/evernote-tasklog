import Vue from "vue";
import _ from "lodash";
import moment from "moment";
import numeral from "numeral";
import logger from "~/src/client/plugins/logger";

export default abstract class BaseComponent extends Vue {
  lodash = _;
  moment = moment;
  numeral = numeral;
  logger = logger;

  async created(): Promise<void> {}

  async mounted(): Promise<void> {}
}
