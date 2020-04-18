// import logger from "../logger";
import BaseClientService from "./base-client.service";
import SocketIoClientService from "./socket-io-client.service";

// TODO: コメントアウトで無効化しているので解除する
// let Push = require("push.js");

export default class PushService extends BaseClientService {
  // lastUpdateCount: number = 0;
  // appComponent: AppComponent;

  constructor(protected socketIoClientService: SocketIoClientService) {
    super();
  }
  /*
  initialize(appComponent: AppComponent): void {
    this.appComponent = appComponent;
    this.socketIoClientService.on(this, "sync::updateCount", this.checkUpdateCount);
    this.socketIoClientService.on(this, "constraint::notify", this.notifyConstraint);
  }

  private async checkUpdateCount(updateCount: number): Promise<void> {
    logger.debug(`Update count from server, updateCount=${updateCount}`);
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
  }

  private async notifyConstraint(): Promise<void> {
    logger.debug("Notify constraint from server.");
    Push.create(i18n.t("push.constraint.title"), {
      body: i18n.t("push.constraint.body"),
      link: "#/constraint",
      timeout: 10000,
      onClick: function (this: any) {
        router.push("constraint");
        this.close();
      },
    });
  }
  */
}
