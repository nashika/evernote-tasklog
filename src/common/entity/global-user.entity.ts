import {BaseMultiEntity, IBaseMultiEntityParams} from "./base-multi.entity";

export class GlobalUserEntity extends BaseMultiEntity {

  static params: IBaseMultiEntityParams = {
    name: "globalUser",
    titleField: "username",
    requireUser: false,
    archive: false,
    default: {
      query: {},
      sort: {username: 1},
      limit: 500,
    },
    append: {
      query: {},
      sort: {},
    },
  };

  sandbox: boolean;
  username: string;
  token: string;

}
