import {BaseSingleTable} from "./base-single-table";
import {BaseSingleEvernoteEntity} from "../../common/entity/base-single-evernote-entity";

export abstract class BaseSingleEvernoteTable<T extends BaseSingleEvernoteEntity<any>> extends BaseSingleTable<T> {

}
