import { injectable } from "inversify";

import NotebookEntity from "~/src/common/entity/notebook.entity";
import BaseEvernoteTable from "~/src/server/table/base-evernote.table";

@injectable()
export class NotebookTable extends BaseEvernoteTable<NotebookEntity> {}
