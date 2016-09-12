import express = require("express");

import {BaseMultiRoute} from "./base-multi-route";
import {NotebookEntity} from "../../common/entity/notebook-entity";
import {NotebookTable} from "../table/notebook-table";

export class NotebookRoute extends BaseMultiRoute<NotebookEntity, NotebookTable> {

  static EntityClass = NotebookEntity;

}
