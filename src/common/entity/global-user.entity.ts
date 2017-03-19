import {BaseEntity, IBaseEntityParams} from "./base.entity";

export class GlobalUserEntity extends BaseEntity {

  static params: IBaseEntityParams = {
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
