import {BaseMultiEntity, IBaseMultiEntityParams} from "./base-multi.entity";

export class GlobalUserEntity extends BaseMultiEntity {

  static params: IBaseMultiEntityParams = {
    name: "globalUser",
    titleField: "username",
    requireUser: false,
    archive: false,
    default: {
      where: {},
      order: [["username", "ASC"]],
      limit: 500,
    },
    append: {
      where: {},
      order: [],
    },
  };

  sandbox: boolean;
  username: string;
  token: string;

}
