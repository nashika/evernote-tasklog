import { ISession } from "connect-typeorm";
import BaseEntity, { EntityParams } from "~/src/common/entity/base.entity";

export default class SessionEntity extends BaseEntity implements ISession {
  static readonly params: EntityParams<SessionEntity> = {
    name: "session",
    primaryKey: "id",
    displayField: "id",
    archive: false,
    default: {
      take: 500,
    },
    append: {},
    columns: {
      expiredAt: {
        type: "integer",
        nullable: false,
      },
      id: {
        type: "string",
        primary: true,
        nullable: false,
      },
      json: {
        type: "text",
        nullable: false,
      },
    },
    indicies: [
      {
        name: "expired_at",
        columns: ["expiredAt"],
      },
    ],
  };

  expiredAt = Date.now();
  public id = "";
  public json = "";
}
