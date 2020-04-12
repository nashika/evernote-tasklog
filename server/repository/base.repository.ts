import { Repository } from "typeorm";
import BaseEntity from "~/common/entity/base.entity";

export default abstract class BaseRepository<T> extends Repository<T> {
  abstract SEntityClass: typeof BaseEntity;

  async initialize(): Promise<void> {}
}
