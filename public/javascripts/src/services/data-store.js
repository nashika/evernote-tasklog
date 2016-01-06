// Generated by CoffeeScript 1.10.0
(function() {
  var DataStoreService;

  DataStoreService = (function() {

    /**
     * @public
     * @type {Object}
     */
    DataStoreService.prototype.user = null;


    /**
     * @public
     * @type {Array}
     */

    DataStoreService.prototype.persons = [];


    /**
     * @public
     * @type {Object}
     */

    DataStoreService.prototype.notebooks = {};


    /**
     * @public
     * @type {Array}
     */

    DataStoreService.prototype.stacks = [];


    /**
     * @public
     * @type {Object}
     */

    DataStoreService.prototype.notes = {};


    /**
     * @public
     * @type {Object}
     */

    DataStoreService.prototype.timeLogs = {};


    /**
     * @public
     * @type {Object}
     */

    DataStoreService.prototype.profitLogs = {};


    /**
     * @constructor
     */

    function DataStoreService() {}

    return DataStoreService;

  })();

  app.service('dataStore', [DataStoreService]);

  module.exports = DataStoreService;

}).call(this);

//# sourceMappingURL=data-store.js.map
