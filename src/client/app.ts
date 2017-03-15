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

let BootstrapVue = require("bootstrap-vue").default;
Vue.use(BootstrapVue);

let AppComponent = container.get("Newable<AppComponent>");
new (<any>AppComponent)({el: "#app"});
