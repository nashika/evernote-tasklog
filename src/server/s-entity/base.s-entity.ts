import BaseCEntity from "~/src/common/c-entity/base.c-entity";

export default abstract class BaseSEntity {
  static CEntityClass: typeof BaseCEntity;

  get Class(): typeof BaseSEntity {
    return <typeof BaseSEntity>this.constructor;
  }

  archiveId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
