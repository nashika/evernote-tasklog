import "font-awesome/css/font-awesome.css";
import "./scss/style.scss";

import "core-js";

// filters
import './filter/abbreviate';
import './filter/filter-by-property';
import './filter/object-length';
import './filter/order-object-by';
import './filter/spent-time';

import {AppComponent} from "./component/app-component";

let app:AppComponent = new (<any>AppComponent)({el: "#app"});
