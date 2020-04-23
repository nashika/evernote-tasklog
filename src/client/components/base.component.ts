import Vue from "vue";
import _ from "lodash";
import moment from "moment";
import numeral from "numeral";
import VueI18n from "vue-i18n";

export default abstract class BaseComponent extends Vue {
  lodash = _;
  moment = moment;
  numeral = numeral;

  /**
   * vud-i18nで$tだとstringではなく専用オブジェクトが返却されるのでstringを無理矢理返却するための関数
   * @param key
   * @param values
   */
  $ts(key: VueI18n.Path, values?: VueI18n.Values): string {
    const result = this.$t(key, values);
    if (typeof result === "string") return result;
    else return result.toString();
  }

  // インスタンスライフサイクルフックの定義
  async beforeCreate(): Promise<void> {}
  async created(): Promise<void> {}
  async beforeMount(): Promise<void> {}
  async mounted(): Promise<void> {}
  async beforeUpdate(): Promise<void> {}
  async updated(): Promise<void> {}
  async beforeDestroy(): Promise<void> {}
  async destroyed(): Promise<void> {}
}
