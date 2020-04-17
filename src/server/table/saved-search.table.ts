import { injectable } from "inversify";

import BaseEvernoteTable from "~/src/server/table/base-evernote.table";
import SavedSearchEntity from "~/src/common/entity/saved-search.entity";

@injectable()
export default class SavedSearchTable extends BaseEvernoteTable<
  SavedSearchEntity
> {}
