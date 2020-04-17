import { injectable } from "inversify";

import BaseEvernoteTable from "~/src/server/table/base-evernote.table";
import TagEntity from "~/src/common/entity/tag.entity";

@injectable()
export default class TagTable extends BaseEvernoteTable<TagEntity> {}
