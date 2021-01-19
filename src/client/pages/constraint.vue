<template lang="pug">
  section#constraint-mode.p-3
    b-table(bordered, striped, hover, small, responsive, head-variant="inverse", foot-clone, foot-variant="default",
      :fields="fields", :items="records")
      template(v-slot:cell(noteTitle)="data")
        a(:href="'evernote:///view/' + $myStore.datastore.user.id + '/' + $myStore.datastore.user.shardId + '/' + data.item.noteGuid + '/' + data.item.noteGuid + '/'") {{data.item.noteTitle}}
    floating-action-button-component(enableReload)
</template>

<script lang="ts">
import { Component } from "nuxt-property-decorator";
import _ from "lodash";

import BaseComponent from "~/src/client/components/base.component";
import ConstraintResultEntity from "~/src/common/entity/constraint-result.entity";
import NoteEntity from "~/src/common/entity/note.entity";
import FloatingActionButtonComponent from "~/src/client/components/floating-action-button.vue";
import { appConfigLoader } from "~/src/common/util/app-config-loader";

interface IConstraintResultRecord {
  noteTitle: string;
  noteGuid: string;
  constraintId: number;
  constraintLabel: string;
}

@Component({
  components: {
    FloatingActionButtonComponent,
  },
})
export default class ConstraintModeComponent extends BaseComponent {
  records: IConstraintResultRecord[] = [];

  fields = [
    {
      key: "noteTitle",
      label: "ノート",
      sortable: true,
    },
    {
      key: "constraintLabel",
      label: "制約",
      sortable: true,
    },
  ];

  async mounted(): Promise<void> {
    await super.mounted();
    await this.reload();
  }

  async reload(): Promise<void> {
    this.$myStore.progress.open(3);
    try {
      this.$myStore.progress.next("リモートサーバと同期しています.");
      await this.$myService.request.sync();
      this.$myStore.progress.next("制約違反ノートの情報を取得しています.");
      const constraintResults = await this.$myService.request.find<ConstraintResultEntity>(
        ConstraintResultEntity,
        {}
      );
      const noteGuids: string[] = _(constraintResults)
        .map((constraintResult) => constraintResult.noteGuid)
        .uniq()
        .value();
      const noteArray = await this.$myService.request.find<NoteEntity>(
        NoteEntity,
        {
          where: { guid: { $in: noteGuids } },
        }
      );
      const notes: { [guid: string]: NoteEntity } = _.keyBy(noteArray, "guid");
      this.records = [];
      for (const constraintResult of constraintResults) {
        const note = notes[constraintResult.noteGuid];
        if (!note) continue;
        this.records.push({
          noteTitle: note.title,
          noteGuid: constraintResult.noteGuid,
          constraintId: constraintResult.constraintId,
          constraintLabel:
            _.find(appConfigLoader.app.constraints, {
              id: constraintResult.constraintId,
            })?.label ?? "制約名未設定",
        });
      }
      this.$myStore.progress.next("Done.");
    } finally {
      this.$myStore.progress.close();
    }
  }
}
</script>
