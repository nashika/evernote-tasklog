import Push from "push.js";

import BaseClientService from "./base-client.service";
import SocketIoClientService from "./socket-io-client.service";
import { logger } from "~/src/client/plugins/logger";

export default class PushService extends BaseClientService {
  // lastUpdateCount: number = 0;
  // appComponent: AppComponent;

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

  private async checkUpdateCount(updateCount: number): Promise<void> {
    logger.debug(`Update count from server, updateCount=${updateCount}`);
    await Push.create("Title", {
      body: "Body",
      timeout: 3000,
    });
    /*
    if (this.lastUpdateCount < updateCount) {
      this.lastUpdateCount = updateCount;
      this.appComponent.reload();
      Push.create(i18n.t("push.update.title"), {
        body: i18n.t("push.update.body"),
        link: "#/activity",
        timeout: 3000,
        onClick: function (this: any) {
          router.push("activity");
          this.close();
        },
      });
    }
    */
  }

  private async notifyConstraint(): Promise<void> {
    logger.debug("Notify constraint from server.");
    /*
    Push.create(i18n.t("push.constraint.title"), {
      body: i18n.t("push.constraint.body"),
      link: "#/constraint",
      timeout: 10000,
      onClick: function (this: any) {
        router.push("constraint");
        this.close();
      },
    });
    */
  }
}
