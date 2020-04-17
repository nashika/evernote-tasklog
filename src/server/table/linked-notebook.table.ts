import { injectable } from "inversify";

import BaseEvernoteTable from "~/src/server/table/base-evernote.table";
import LinkedNotebookEntity from "~/src/common/entity/linked-notebook.entity";

@injectable()
export default class LinkedNotebookTable extends BaseEvernoteTable<
  LinkedNotebookEntity
> {}
