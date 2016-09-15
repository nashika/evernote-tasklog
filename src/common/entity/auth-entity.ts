import {BaseEntity, IBaseEntityParams} from "./base-entity";

export class AuthEntity extends BaseEntity {

  static params:IBaseEntityParams = {
    name: "auth",
    titleField: "name",
    requireUser: true,
  };

  token: string;
  username: string;

}
