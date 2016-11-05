import {injectable} from "inversify";
import {Request, Response} from "express";

import {SettingEntity} from "../../common/entity/setting-entity";
import {SettingTable} from "../table/setting-table";
import {BaseMultiRoute} from "./base-multi-route";
import {TableService} from "../service/table-service";
import {SessionService} from "../service/session-service";
import {SettingService} from "../service/setting-service";

@injectable()
export class SettingRoute extends BaseMultiRoute<SettingEntity, SettingTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService,
              protected settingService: SettingService) {
    super(tableService, sessionService);
  }

  save(req: Request, res: Response): Promise<boolean> {
    let session = this.sessionService.get(req);
    return super.save(req, res).then(result => {
      return this.settingService.initializeUser(session.globalUser).then(() => {
        return result;
      });
    });
  }

}
