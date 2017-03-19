import {injectable} from "inversify";
import {Request, Response} from "express";

import {OptionEntity} from "../../common/entity/option.entity";
import {OptionTable} from "../table/option.table";
import {BaseEntityRoute} from "./base-entity.route";
import {TableService} from "../service/table.service";
import {SessionService} from "../service/session.service";
import {SettingService} from "../service/setting.service";

@injectable()
export class OptionRoute extends BaseEntityRoute<OptionEntity, OptionTable> {

  constructor(protected tableService: TableService,
              protected sessionService: SessionService,
              protected settingService: SettingService) {
    super(tableService, sessionService);
  }

  async save(req: Request, res: Response): Promise<boolean> {
    let result = await super.save(req, res);
    let session = this.sessionService.get(req);
    await this.settingService.initializeUser(session.globalUser);
    return result;
  }

}
