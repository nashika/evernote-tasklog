import Vue from "vue";
import _ from "lodash";
import moment from "moment";
import numeral from "numeral";
import { SocketIoClientService } from "~/plugins/socket-io";

export default abstract class BaseComponent extends Vue {
  lodash = _;
  moment = moment;
  numeral = numeral;

  // @ts-ignore
  $socketIoService: SocketIoClientService;

  async created(): Promise<void> {}

  async mounted(): Promise<void> {}
}
