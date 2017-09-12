import Vue from "vue";
import VueI18n from "vue-i18n";

import messages from "../lang/index";

Vue.use(VueI18n);

let language = (window.navigator.languages && window.navigator.languages[0]) || window.navigator.language
  || (<any>window.navigator).userLanguage || (<any>window.navigator).browserLanguage;
language = language.substr(0, 2);

export const i18n = new VueI18n ({
  locale: language,
  fallbackLocale: "en",
  messages,
});
