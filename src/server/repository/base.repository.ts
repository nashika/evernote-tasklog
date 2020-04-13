import { Repository } from "typeorm";
import BaseSEntity from "~/src/server/s-entity/base.s-entity";

export default abstract class BaseRepository<T> extends Repository<T> {
  abstract SEntityClass: typeof BaseSEntity;

  async initialize(): Promise<void> {}
}
