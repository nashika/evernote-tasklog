import _ = require("lodash");

// ver.20161203
export class MyPromise {

  public static eachSeries<T>(collection: T[], eachFunc: (item: T, key?: number) => Promise<any>): Promise<void>;
  public static eachSeries<T>(collection: {[key: string]: T}, eachFunc: (item: T, key?: string) => Promise<any>): Promise<void>;
  public static eachSeries<T>(collection: T[] | {[key: string]: T}, eachFunc: (item: T) => Promise<any>): Promise<void>;
  public static eachSeries<T>(collection: T[] | {[key: string]: T}, eachFunc: (item: T, key?: number | string) => Promise<any>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      _.reduce(collection, (promise: Promise<any>, item: T, key: number|string) => {
        return promise.then(() => {
          return eachFunc(item, key);
        });
      }, Promise.resolve()).then(() => {
        resolve();
      }).catch(err => {
        reject(err);
      });
    });
  }

  public static mapSeries<T, TResult>(collection: T[], eachFunc: (item: T, key?: number) => Promise<TResult>): Promise<TResult[]>;
  public static mapSeries<T, TResult>(collection: {[key: string]: T}, eachFunc: (item: T, key?: string) => Promise<TResult>): Promise<TResult[]>;
  public static mapSeries<T, TResult>(collection: T[] | {[key: string]: T}, eachFunc: (item: T) => Promise<TResult>): Promise<TResult[]>;
  public static mapSeries<T, TResult>(collection: T[] | {[key: string]: T}, eachFunc: (item: T, key?: number | string) => Promise<TResult>): Promise<TResult[]> {
    let results: TResult[] = [];
    return this.eachSeries(collection, (item: T) => {
      return eachFunc(item).then((result: TResult) => results.push(result));
    }).then(() => {
      return results;
    });
  }

  public static whileSeries(condFunc: () => boolean, eachFunc: () => Promise<void>): Promise<void> {
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
