import _ = require("lodash");

export abstract class ClassRegistry<T> {

  protected Classes: {[key: string]: Function};

  getClass(name: string): Function {
    let key = _.camelCase(name);
    if (this.Classes[key]) {
      return this.Classes[key];
    }
    return undefined;
  }

  getAllClasses(): {[key: string]: Function} {
    let result: {[key: string]: Function} = {};
    for (let key in this.Classes) {
      result[key] = this.Classes[key]
    }
    return result;
  }

  getAllClassesArray(): Function[] {
    let result: Function[];
    result = Object.keys(this.Classes).map(key => this.Classes[key]);
    return result;
  }

}
