import "reflect-metadata";
import "core-js";

import {configLoader} from "../common/util/config-loader";
configLoader.isBrowser = true;

// filters
import "./filter/abbreviate.filter";
import "./filter/filter-by-property.filter";
import "./filter/numeral.filter";
import "./filter/object-length.filter";
import "./filter/order-object-by.filter";
import "./filter/spent-time.filter";

import Vue from "vue";
import VueRouter from "vue-router";
let BootstrapVue = require("bootstrap-vue").default;
//let BootstrapVue = require("bootstrap-vue").default;

Vue.use(VueRouter);
Vue.use(BootstrapVue);

Vue.component("app-navigation", require("./component/navigation/navigation.component.vue").default);
Vue.component("app-filter-modal", require("./component/+modal/filter-modal/filter-modal.component.vue").default);
Vue.component("app-person-modal", require("./component/+modal/person-modal/person-modal.component.vue").default);
Vue.component("app-progress-modal", require("./component/+modal/progress-modal/progress-modal.component.vue").default);
Vue.component("app-floating-action-button", require("./component/floating-action-button/floating-action-button.vue").default);

const routes = [
  {path: "/", redirect: "/attendance"},
  {path: "/attendance", component: require("./component/+mode/attendance-mode/attendance-mode.component.vue").default},
  {path: "/timeline", component: require("./component/+mode/timeline-mode/timeline-mode.component.vue").default},
  {path: "/notes", component: require("./component/+mode/notes-mode/notes-mode.component.vue").default},
  {path: "/activity", component: require("./component/+mode/activity-mode/activity-mode.component.vue").default},
];
export const router = new VueRouter({routes});

let AppComponent = require("./component/app.component.vue").default;
new (<any>AppComponent)({router}).$mount("#app");
