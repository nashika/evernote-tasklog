import {BaseEntity, IEntityParams} from "./base-entity";

export class AuthEntity extends BaseEntity {

  static params:IEntityParams = {
    name: "auth",
  };

  token: string;
  username: string;

}
