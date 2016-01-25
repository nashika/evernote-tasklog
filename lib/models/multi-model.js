var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var async = require('async');
var merge = require('merge');
var core_1 = require('../core');
var model_1 = require('./model');
var MultiModel = (function (_super) {
    __extends(MultiModel, _super);
    function MultiModel() {
        _super.apply(this, arguments);
    }
    MultiModel.prototype.findLocal = function (options, callback) {
        var _this = this;
        options = this.__parseFindOptions(options);
        core_1["default"].loggers.system.debug("Find local " + this.constructor.PLURAL_NAME + " was started. query=" + JSON.stringify(options['query']) + ", sort=" + JSON.stringify(options['sort']) + ", limit=" + options['limit']);
        this._datastore.find(options['query']).sort(options['sort']).limit(options['limit']).exec(function (err, docs) {
            core_1["default"].loggers.system.debug("Find local " + _this.constructor.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". docs.length=" + docs.length);
            callback(err, docs);
        });
    };
    MultiModel.prototype.countLocal = function (options, callback) {
        var _this = this;
        options = this.__parseFindOptions(options);
        core_1["default"].loggers.system.debug("Count local " + this.constructor.PLURAL_NAME + " was started. query=" + JSON.stringify(options['query']));
        this._datastore.count(options['query'], function (err, count) {
            core_1["default"].loggers.system.debug("Count local " + _this.constructor.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". count=" + count);
            callback(err, count);
        });
    };
    MultiModel.prototype.__parseFindOptions = function (options) {
        var result = {};
        // Detect options has query only or has some parameters.
        result['query'] = options['query'] || merge(true, this.constructor.DEFAULT_QUERY);
        result['sort'] = options['sort'] || merge(true, this.constructor.DEFAULT_SORT);
        result['limit'] = options['limit'] || this.constructor.DEFAULT_LIMIT;
        // If some parameter type is string, convert object.
        for (var _i = 0, _a = ['query', 'sort']; _i < _a.length; _i++) {
            var key = _a[_i];
            switch (typeof result[key]) {
                case 'object':
                    result[key] = result[key];
                    break;
                case 'string':
                    result[key] = JSON.parse(result[key]);
                    break;
            }
        }
        // Merge default append parameters.
        merge(result['query'], this.constructor.APPEND_QUERY);
        merge(result['sort'], this.constructor.APPEND_SORT);
        return result;
    };
    MultiModel.prototype.saveLocal = function (docs, callback) {
        var _this = this;
        if (!docs)
            return callback();
        var arrDocs = (Array.isArray(docs)) ? docs : [docs];
        if (arrDocs.length == 0)
            return callback();
        core_1["default"].loggers.system.debug("Save local " + this.constructor.PLURAL_NAME + " was started. docs.count=" + docs['length']);
        async.eachSeries(arrDocs, function (doc, callback) {
            core_1["default"].loggers.system.trace("Upsert local " + _this.constructor.PLURAL_NAME + " was started. guid=" + doc['guid'] + ", title=" + doc[_this.constructor.TITLE_FIELD]);
            _this._datastore.update({ guid: doc['guid'] }, doc, { upsert: true }, function (err, numReplaced) {
                var restArgs = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    restArgs[_i - 2] = arguments[_i];
                }
                core_1["default"].loggers.system.trace("Upsert local " + _this.constructor.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". guid=" + doc['guid'] + ", numReplaced=" + numReplaced);
                callback(err);
            });
        }, function (err) {
            core_1["default"].loggers.system.debug("Save local " + _this.constructor.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". docs.count=" + docs['length']);
            callback(err);
        });
    };
    MultiModel.prototype.saveLocalUpdateOnly = function (docs, callback) {
        var _this = this;
        var arrDocs;
        if (!docs || docs['length'] == 0)
            return callback();
        if (!Array.isArray(docs))
            arrDocs = [docs];
        core_1["default"].loggers.system.debug("Save local update only " + this.constructor.PLURAL_NAME + " was started. docs.count=" + docs['length']);
        async.eachSeries(arrDocs, function (doc, callback) {
            var localDoc = null;
            async.waterfall([
                function (callback) {
                    _this._datastore.find({ guid: doc['guid'] }, callback);
                },
                function (docs, callback) {
                    localDoc = (docs.length == 0) ? null : docs[0];
                    if (localDoc && localDoc.updateSequenceNum >= doc['updateSequenceNum']) {
                        core_1["default"].loggers.system.trace("Upsert local " + _this.constructor.PLURAL_NAME + " was skipped. guid=" + doc['guid'] + ", title=" + doc[_this.constructor.TITLE_FIELD]);
                        callback();
                    }
                    else {
                        core_1["default"].loggers.system.trace("Upsert local " + _this.constructor.PLURAL_NAME + " was started. guid=" + doc['guid'] + ", title=" + doc[_this.constructor.TITLE_FIELD]);
                        async.waterfall([
                            function (callback) {
                                _this._datastore.db[_this.constructor.PLURAL_NAME].update({ guid: doc['guid'] }, doc, { upsert: true }, callback);
                            },
                            function (numReplaced) {
                                var restArgs = [];
                                for (var _i = 1; _i < arguments.length; _i++) {
                                    restArgs[_i - 1] = arguments[_i];
                                }
                                var callback = restArgs.pop();
                                core_1["default"].loggers.system.trace("Upsert local " + _this.constructor.PLURAL_NAME + " was succeed. guid=" + doc['guid'] + ", numReplaced=" + numReplaced);
                                callback();
                            },
                        ], callback);
                    }
                },
            ], callback);
        }, function (err) {
            core_1["default"].loggers.system.debug("Save local update only " + _this.constructor.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". docs.count=" + docs['length']);
            callback(err);
        });
    };
    MultiModel.prototype.removeLocal = function (query, callback) {
        var _this = this;
        if (!query)
            return callback();
        if (Array.isArray(query)) {
            if (query['length'] == 0)
                return callback();
            query = { guid: { $in: query } };
        }
        if (typeof query == 'string') {
            query = { guid: query };
        }
        core_1["default"].loggers.system.debug("Remove local " + this.constructor.PLURAL_NAME + " was started. query=" + JSON.stringify(query));
        this._datastore.remove(query, { multi: true }, function (err, numRemoved) {
            core_1["default"].loggers.system.debug("Remove local " + _this.constructor.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". numRemoved=" + numRemoved);
            callback(err);
        });
    };
    MultiModel.DEFAULT_QUERY = {};
    MultiModel.APPEND_QUERY = {};
    MultiModel.DEFAULT_SORT = { updated: -1 };
    MultiModel.APPEND_SORT = {};
    MultiModel.DEFAULT_LIMIT = 500;
    return MultiModel;
})(model_1["default"]);
exports.__esModule = true;
exports["default"] = MultiModel;
//# sourceMappingURL=multi-model.js.map