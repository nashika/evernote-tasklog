import * as evernote from "evernote";

import MultiEntity from "./multi-entity";

export class LinkedNotebookEntity extends evernote.Evernote.LinkedNotebook implements MultiEntity {
}

export default LinkedNotebookEntity;
