import { Repository } from "typeorm";
import BaseEntity from "~/src/common/entity/base.entity";

export default abstract class BaseRepository<
  T extends BaseEntity
> extends Repository<T> {
  abstract EntityClass: typeof BaseEntity;

  async initialize(): Promise<void> {}
}
