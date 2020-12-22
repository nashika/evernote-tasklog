import Push from "push.js";

import BaseClientService from "./base-client.service";
import SocketIoClientService from "./socket-io-client.service";
import { logger } from "~/src/client/plugins/logger";

import DefaultLayoutComponent from "~/src/client/layouts/default.vue";
import { assertIsDefined } from "~/src/common/util/assert";

export default class PushService extends BaseClientService {
  lastUpdateCount: number = 0;
  rootComponent!: DefaultLayoutComponent;

  constructor(protected socketIoClientService: SocketIoClientService) {
    super();
    this.socketIoClientService.on(
      this,
      "sync::updateCount",
      this.checkUpdateCount
    );
    this.socketIoClientService.on(
      this,
      "constraint::notify",
      this.notifyConstraint
    );
  }

  initialize(rootComponent: DefaultLayoutComponent) {
    this.rootComponent = rootComponent;
  }

  private async checkUpdateCount(updateCount: number): Promise<void> {
    logger.debug(`Update count from server, updateCount=${updateCount}`);
    if (this.lastUpdateCount === 0) {
      this.lastUpdateCount = updateCount;
    } else if (this.lastUpdateCount < updateCount) {
      this.lastUpdateCount = updateCount;
      const this_ = this;
      await Push.create("Evernote更新通知", {
        link: "/activity",
        timeout: 3000,
        onClick(this: any) {
          this_.rootComponent.$router.push("activity");
          this.close();
        },
      });
    }
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
