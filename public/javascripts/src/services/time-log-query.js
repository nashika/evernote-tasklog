// Generated by CoffeeScript 1.10.0
(function() {
  var TimeLogQueryService, merge,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  merge = require('merge');

  TimeLogQueryService = (function() {

    /**
     * @public
     * @type {number}
     */
    TimeLogQueryService.prototype.worked = 3;


    /**
     * @public
     * @type {number}
     */

    TimeLogQueryService.prototype.count = null;


    /**
     * @constructor
     * @param {SyncDataService} syncData
     */

    function TimeLogQueryService(dataStore) {
      this.dataStore = dataStore;
      this.query = bind(this.query, this);
    }


    /**
     * @public
     * @return {Object}
     */

    TimeLogQueryService.prototype.query = function() {
      var result;
      result = {};
      if (this.worked) {
        merge(result, {
          date: {
            $gte: parseInt(moment().startOf('day').subtract(this.worked, 'days').format('x'))
          }
        });
      }
      return result;
    };

    return TimeLogQueryService;

  })();

  app.service('timeLogQuery', ['dataStore', TimeLogQueryService]);

  module.exports = TimeLogQueryService;

}).call(this);

//# sourceMappingURL=time-log-query.js.map
