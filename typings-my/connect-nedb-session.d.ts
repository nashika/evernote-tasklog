declare module "connect-nedb-session" {
  class NedbStore {
    /**
     * Constructor
     * @param {String} options.filename File where session data will be persisted
     * @param {Function} cp Optional callback (useful when testing)
     */
    constructor(options, cb);

    get(sid, callback): void;

    set(sid, data, callback): void;

    destroy(sid, callback): void;
  }

  function e(session): any;

  export = e;

}
