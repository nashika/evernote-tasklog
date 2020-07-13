import { Module, Mutation, VuexModule } from "vuex-module-decorators";
import Evernote from "evernote";
import _ from "lodash";
import moment from "moment";

import NotebookEntity from "~/src/common/entity/notebook.entity";
import TagEntity from "~/src/common/entity/tag.entity";
import NoteEntity from "~/src/common/entity/note.entity";
import TimeLogEntity from "~/src/common/entity/time-log.entity";
import ProfitLogEntity from "~/src/common/entity/profit-log.entity";
import configLoader from "~/src/common/util/config-loader";

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
  lastUpdateCount: number = 0;
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
  setLastUpdateCount(count: number) {
    this.lastUpdateCount = count;
  }

  @Mutation
  setUser(user: Evernote.Types.User) {
    this.user = user;
  }

  @Mutation
  setCurrentPersonId(id: number) {
    this.currentPersonId = id;
  }

  @Mutation
  setNotebooks(notebooks: { [guid: string]: NotebookEntity }) {
    this.notebooks = notebooks;
  }

  @Mutation
  setStacks(stacks: string[]) {
    this.stacks = stacks;
  }

  @Mutation
  setTags(tags: { [guid: string]: TagEntity }) {
    this.tags = tags;
  }
}
