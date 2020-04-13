import Vue from "vue";
import _ from "lodash";
import moment from "moment";
import numeral from "numeral";
import { SocketIoClientService } from "~/src/client/plugins/socket-io";
import logger from "~/src/client/plugins/logger";

export default abstract class BaseComponent extends Vue {
  lodash = _;
  moment = moment;
  numeral = numeral;
  logger = logger;

  // @ts-ignore
  $socketIoService: SocketIoClientService;

  async created(): Promise<void> {}

  async mounted(): Promise<void> {}
}
