import {
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";
import Evernote from "evernote";
import _ from "lodash";

import { NotebookEntity } from "~/src/common/entity/notebook.entity";
import { TagEntity } from "~/src/common/entity/tag.entity";
import { myService } from "~/src/client/service";
import { appConfigLoader } from "~/src/common/util/app-config-loader";

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
      _.find(appConfigLoader.app.persons, { id: this.currentPersonId }) ?? null
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
      stacks: _(notebooks).map("stack").uniq().filter(_.isString).value(),
      tags: _.keyBy(tags, "guid"),
    };
  }
}
