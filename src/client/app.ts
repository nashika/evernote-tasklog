import "font-awesome/css/font-awesome.css";
import "./scss/style.scss";

import "reflect-metadata";
import "core-js";

// filters
import './filter/abbreviate';
import './filter/filter-by-property';
import './filter/object-length';
import './filter/order-object-by';
import './filter/spent-time';

import {kernel} from "./inversify.config";

let AppComponent = kernel.get("Newable<AppComponent>");
let app = new (<any>AppComponent)({el: "#app"});
