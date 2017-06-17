import "reflect-metadata";
import "core-js";

import {configLoader} from "../common/util/config-loader";
configLoader.isBrowser = true;

// filters
import "./filter/abbreviate.filter";
import "./filter/filter-by-property.filter";
import "./filter/object-length.filter";
import "./filter/order-object-by.filter";
import "./filter/spent-time.filter";

import Vue = require("vue");
import VueRouter from "vue-router";
let BootstrapVue = require("bootstrap-vue").default;
//let BootstrapVue = require("bootstrap-vue").default;

Vue.use(VueRouter);
Vue.use(BootstrapVue);

Vue.component("app-navigation", require("./component/navigation/navigation.component.vue"));
Vue.component("app-progress", require("./component/progress/progress.component.vue"));

const routes = [
  {path: "/", component: require("./component/+mode/menu-mode/menu-mode.component.vue")},
  {path: "/timeline", component: require("./component/+mode/timeline-mode/timeline-mode.component.vue")},
  {path: "/notes", component: require("./component/+mode/notes-mode/notes-mode.component.vue")},
  {path: "/activity", component: require("./component/+mode/activity-mode/activity-mode.component.vue")},
  {path: "/settings", component: require("./component/+mode/settings-mode/settings-mode.component.vue")},
];
export const router = new VueRouter({routes});

let AppComponent = require("./component/app.component.vue");
new (<any>AppComponent)({router}).$mount("#app");
