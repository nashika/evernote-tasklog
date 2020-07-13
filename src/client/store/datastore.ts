import {
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";
import Evernote from "evernote";
import _ from "lodash";
import moment from "moment";

import NotebookEntity from "~/src/common/entity/notebook.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import NoteEntity from "~/src/common/entity/note.entity";
import TimeLogEntity from "~/src/common/entity/time-log.entity";
import ProfitLogEntity from "~/src/common/entity/profit-log.entity";
import configLoader from "~/src/common/util/config-loader";
import { myService } from "~/src/client/service";

export interface IDatastoreServiceNoteFilterParams {
  start?: moment.Moment;
  end?: moment.Moment;
  notebookGuids?: string[];
  stacks?: string[];
  hasContent?: boolean;
  archiveMinStepMinute?: number;
}

export interface IDatastoreServiceTimeLogFilterParams {
  start?: moment.Moment;
  end?: moment.Moment;
  noteGuids?: string[];
}

export class TerminateResult {
  data: any;
  constructor(argData: any = null) {
    this.data = argData;
  }

  toString(): string {
    return this.data;
  }
}

export type TNotesResult = { [guid: string]: NoteEntity };
export type TTimeLogsResult = {
  [noteGuid: string]: { [id: number]: TimeLogEntity };
};
export type TProfitLogsResult = {
  [noteGuid: string]: { [id: number]: ProfitLogEntity };
};

export interface INoteLogsResult {
  notes: TNotesResult | null;
  timeLogs: TTimeLogsResult | null;
  profitLogs: TProfitLogsResult | null;
}

@Module({
  name: "datastore",
  stateFactory: true,
  namespaced: true,
})
export default class DatastoreModule extends VuexModule {
  user: Evernote.Types.User | null = null;
  currentPersonId: number = 0;
  notebooks: { [guid: string]: NotebookEntity } = {};
  stacks: string[] = [];
  tags: { [guid: string]: TagEntity } = {};

  get currentPerson(): AppConfig.IPersonConfig | null {
    return (
      _.find(configLoader.app.persons, { id: this.currentPersonId }) ?? null
    );
  }

  @Mutation
  setCurrentPersonId(id: number) {
    this.currentPersonId = id;
  }

  @MutationAction({
    mutate: ["user", "currentPersonId", "notebooks", "stacks", "tags"],
  })
  async initialize() {
    const user = await myService.request.loadOption("user");
    const currentPersonId = _.toInteger(
      (await myService.request.loadSession("currentPersonId")) || 0
    );
    const notebooks = await myService.request.find<NotebookEntity>(
      NotebookEntity
    );
    const tags = await myService.request.find<TagEntity>(TagEntity);
    return {
      user,
      currentPersonId,
      notebooks: _.keyBy(notebooks, "guid"),
      stacks: _(notebooks)
        .map("stack")
        .uniq()
        .filter(_.isString)
        .value(),
      tags: _.keyBy(tags, "guid"),
    };
  }
}
