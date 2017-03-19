import {BaseMultiEntity, IBaseMultiEntityParams} from "./base-multi.entity";

export class GlobalUserEntity extends BaseMultiEntity {

  static params: IBaseMultiEntityParams = {
    name: "globalUser",
    primaryKey: "key",
    displayField: "username",
    requireUser: false,
    archive: false,
    default: {
      where: {},
      order: [["key", "ASC"]],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  key: string;
  sandbox: boolean;
  username: string;
  token: string;

}
