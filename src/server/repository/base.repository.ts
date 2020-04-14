import { Repository } from "typeorm";
import _ from "lodash";
import BaseEntity from "~/src/common/entity/base.entity";
import container from "~/src/server/inversify.config";
import {
  INVERSIFY_MODELS,
  INVERSIFY_TYPES,
} from "~/src/server/inversify.symbol";

export default abstract class BaseRepository<
  T extends BaseEntity
> extends Repository<T> {
  EntityClass: typeof BaseEntity;

  constructor() {
    super();
    const name = _.replace(this.Class.name, /Repository$/, "");
    this.EntityClass = <any>(
      container.getNamed(INVERSIFY_TYPES.Entity, _.get(INVERSIFY_MODELS, name))
    );
  }

  get Class(): typeof BaseRepository {
    return <typeof BaseRepository>this.constructor;
  }

  async initialize(): Promise<void> {}
}
