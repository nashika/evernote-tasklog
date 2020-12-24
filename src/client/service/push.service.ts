import Push from "push.js";

import BaseClientService from "./base-client.service";
import SocketIoClientService from "./socket-io-client.service";
import { logger } from "~/src/client/plugins/logger";
import DefaultLayoutComponent from "~/src/client/layouts/default.vue";
import RequestService from "~/src/client/service/request.service";
import NoteEntity from "~/src/common/entity/note.entity";

export default class PushService extends BaseClientService {
  lastUpdateCount: number = 0;
  rootComponent!: DefaultLayoutComponent;

  constructor(
    protected socketIoClientService: SocketIoClientService,
    protected requestService: RequestService
  ) {
    super();
    this.socketIoClientService.on(this, "sync::updateNotes", this.updateNotes);
    this.socketIoClientService.on(
      this,
      "constraint::notify",
      this.notifyConstraint
    );
  }

  initialize(rootComponent: DefaultLayoutComponent) {
    this.rootComponent = rootComponent;
  }

  private async updateNotes(guids: string[]): Promise<void> {
    const this_ = this;
    const notes = await this.requestService.find(NoteEntity, {
      where: { guid: { $in: guids } },
    });
    await Push.create("Evernote更新通知", {
      body: notes.map((note) => note.title).join("\n"),
      link: "/activity",
      timeout: 5000,
      onClick(this: any) {
        this_.rootComponent.$router.push("activity");
        this.close();
      },
    });
  }

  private async notifyConstraint(): Promise<void> {
    logger.debug("Notify constraint from server.");
    const this_ = this;
    await Push.create("Evernote制約違反通知", {
      link: "/constraint",
      timeout: 10000,
      onClick(this: any) {
        this_.rootComponent?.$router.push("constraint");
        this.close();
      },
    });
  }
}
