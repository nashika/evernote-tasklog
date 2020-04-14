import { Repository } from "typeorm";
import BaseCEntity from "~/src/common/c-entity/base.c-entity";

export default abstract class BaseRepository<
  T extends BaseCEntity
> extends Repository<T> {
  abstract CEntityClass: typeof BaseCEntity;

  async initialize(): Promise<void> {}
}
