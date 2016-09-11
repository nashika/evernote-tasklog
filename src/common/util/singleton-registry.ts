import _ = require("lodash");
import {ClassRegistry} from "./class-registry";

export abstract class SingletonRegistry<T> extends ClassRegistry<T> {

  protected instances: {[key: string]: T};

  constructor() {
    super();
    this.instances = {};
  }

  getInstance(name: string): T {
    let key = _.camelCase(name);
    if (this.instances[key]) {
      return this.instances[key];
    }
    let Class: any = this.Classes[key];
    if (Class) {
      let instance = new (<any>Class)();
      this.instances[key] = instance;
      return instance;
    }
    return undefined;
  }

  getAllInstance(): {[key: string]: T} {
    let result: {[key: string]: T} = {};
    for (let key in this.Classes) {
      result[key] = this.getInstance(key);
    }
    return this.instances;
  }

  getAllInstanceArray(): T[] {
    let result: T[];
    result = Object.keys(this.Classes).map(key => this.getInstance(key));
    return result;
  }

}
