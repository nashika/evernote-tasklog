import _ = require("lodash");

export class MyPromiseTerminateResult {

  constructor(public data: any) {
  }

  toString(): string {
    return this.data;
  }

}

export class MyPromise {

  public static eachFunctionSeries<T1>(collection: T1[], eachFunc: (resolve: () => void, reject: (err: any) => void, item: T1, key?: number) => void): Promise<void>;
  public static eachFunctionSeries<T1>(collection: {[key: string]: T1}, eachFunc: (resolve: () => void, reject: (err: any) => void, item: T1, key?: string) => void): Promise<void>;
  public static eachFunctionSeries<T1, T2>(collection: T1[], eachFunc: (resolve: () => void, reject: (err: any) => void, item: T1, key?: number) => void, resultFunc: () => T2): Promise<T2>;
  public static eachFunctionSeries<T1, T2>(collection: {[key: string]: T1}, eachFunc: (resolve: () => void, reject: (err: any) => void, item: T1, key?: string) => void, resultFunc: () => T2): Promise<T2>;
  public static eachFunctionSeries<T1, T2>(collection: T1[]|{[key: string]: T1}, eachFunc: (resolve: () => void, reject: (err: any) => void, item: T1, key?: number|string) => void, resultFunc: () => T2 = undefined): Promise<T2> {
    if (_.isArray(collection)) {
      let eachPromiseFunc = (item: T1, key?: number) => {
        return new Promise<void>((resolve, reject) => eachFunc(resolve, reject, item, key));
      };
      return MyPromise.eachPromiseSeries(collection, eachPromiseFunc, resultFunc);
    } else if (_.isObject(collection)) {
      let eachPromiseFunc = (item: T1, key?: string) => {
        return new Promise<void>((resolve, reject) => eachFunc(resolve, reject, item, key));
      };
      return MyPromise.eachPromiseSeries<T1, T2>(collection, eachPromiseFunc, resultFunc);
    } else {
      throw new Error();
    }
  }

  public static eachPromiseSeries<T1>(collection: T1[], eachFunc: (item: T1, key?: number) => Promise<any>): Promise<void>;
  public static eachPromiseSeries<T1>(collection: {[key: string]: T1}, eachFunc: (item: T1, key?: string) => Promise<any>): Promise<void>;
  public static eachPromiseSeries<T1, T2>(collection: T1[], eachFunc: (item: T1, key?: number) => Promise<any>, resultFunc: () => T2): Promise<T2>;
  public static eachPromiseSeries<T1, T2>(collection: {[key: string]: T1}, eachFunc: (item: T1, key?: string) => Promise<any>, resultFunc: () => T2): Promise<T2>;
  public static eachPromiseSeries<T1, T2>(collection: T1[]|{[key: string]: T1}, eachFunc: (item: T1, key?: number|string) => Promise<any>, resultFunc: () => T2 = undefined): Promise<T2> {
    return new Promise<T2>((resolve, reject) => {
      _.reduce(collection, (promise: Promise<any>, item: T1, key: number|string) => {
        return promise.then(() => {
          return eachFunc(item, key);
        });
      }, Promise.resolve()).then(() => {
        if (resultFunc)
          resolve(resultFunc());
        else
          resolve();
      }).catch(err => reject(err));
    });
  }

  public static whileFunctionSeries(condFunc: () => boolean, eachFunc: (resolve: () => void, reject: (err: any) => void) => void): Promise<void> {
    let whilePromiseFunc = () => {
      return new Promise<void>((resolve, reject) => eachFunc(resolve, reject));
    };
    return MyPromise.whilePromiseSeries(condFunc, whilePromiseFunc);
  }

  public static whilePromiseSeries(condFunc: () => boolean, eachFunc: () => Promise<void>): Promise<void> {
    let loop: (() => Promise<void>) = () => {
      if (condFunc()) {
        return eachFunc().then(loop);
      } else {
        return Promise.resolve();
      }
    };
    return loop();
  }

}
