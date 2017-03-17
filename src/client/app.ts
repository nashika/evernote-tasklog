import "font-awesome/css/font-awesome.css";
import "./scss/style.scss";

import "reflect-metadata";
import "core-js";

// filters
import './filter/abbreviate.filter';
import './filter/filter-by-property.filter';
import './filter/object-length.filter';
import './filter/order-object-by.filter';
import './filter/spent-time.filter';

import {container} from "./inversify.config";
import Vue = require("vue");
import VueRouter from "vue-router";
let BootstrapVue = require("bootstrap-vue").default;
Vue.use(VueRouter);
Vue.use(BootstrapVue);

import {MenuModeComponent} from "./component/mode/menu-mode.component";
import {TimelineModeComponent} from "./component/mode/timeline-mode.component";
import {NotesModeComponent} from "./component/mode/notes-mode.component";
import {ActivityModeComponent} from "./component/mode/activity-mode.component";
import {SettingsModeComponent} from "./component/mode/settings-mode.component";

const routes = [
  {path: "/", component: MenuModeComponent},
  {path: "/timeline", component: TimelineModeComponent},
  {path: "/notes", component: NotesModeComponent},
  {path: "/activity", component: ActivityModeComponent},
  {path: "/settings", component: SettingsModeComponent},
];
const router = new VueRouter({routes});

let AppComponent = container.get("Newable<AppComponent>");
new (<any>AppComponent)({router}).$mount("#app");
