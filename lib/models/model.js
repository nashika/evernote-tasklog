// Generated by CoffeeScript 1.9.3
(function() {
  var Model, async, core,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  async = require('async');

  core = require('../core');

  Model = (function() {
    function Model() {
      this.s_removeLocal = bind(this.s_removeLocal, this);
      this.s_saveLocal = bind(this.s_saveLocal, this);
    }


    /**
     * @const
     * @type {string}
     */

    Model.prototype.PLURAL_NAME = '';


    /**
     * @const
     * @type {string}
     */

    Model.prototype.TITLE_FIELD = '';


    /**
     * @public
     * @static
     * @param {Array} docs
     * @param {function} callback
     */

    Model.prototype.s_saveLocal = function(docs, callback) {
      if (!docs || docs.length === 0) {
        return callback();
      }
      core.loggers.system.debug("Save local " + this.PLURAL_NAME + " start. docs.count=" + docs.length);
      return async.eachSeries(docs, (function(_this) {
        return function(doc, callback) {
          core.loggers.system.debug("Upsert " + _this.PLURAL_NAME + " start. guid=" + doc.guid + ", title=" + doc[_this.TITLE_FIELD]);
          return core.db[_this.PLURAL_NAME].update({
            guid: doc.guid
          }, doc, {
            upsert: true
          }, function(err, numReplaced, newDoc) {
            if (err) {
              return callback(err);
            }
            core.loggers.system.debug("Upsert " + _this.PLURAL_NAME + " end. guid=" + doc.guid + ", numReplaced=" + numReplaced);
            return callback();
          });
        };
      })(this), callback);
    };


    /**
     * @public
     * @static
     * @param {Array.<string>} guids
     * @param {function} callback
     */

    Model.prototype.s_removeLocal = function(guids, callback) {
      if (!guids || guids.length === 0) {
        return callback();
      }
      core.loggers.system.debug("Remove local " + this.PLURAL_NAME + " start. guids.count=" + guids.length);
      return core.db[this.PLURAL_NAME].remove({
        guid: {
          $in: guids
        }
      }, (function(_this) {
        return function(err, numRemoved) {
          if (err) {
            return callback(err);
          }
          core.loggers.system.debug("Remove local " + _this.PLURAL_NAME + " end. numRemoved=" + numRemoved);
          return callback();
        };
      })(this));
    };

    return Model;

  })();

  module.exports = Model;

}).call(this);

//# sourceMappingURL=model.js.map