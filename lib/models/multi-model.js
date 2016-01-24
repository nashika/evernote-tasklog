var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var async = require('async');
var merge = require('merge');
var core = require('../core');
var model_1 = require('./model');
var MultiModel = (function (_super) {
    __extends(MultiModel, _super);
    function MultiModel() {
        _super.apply(this, arguments);
        this.DEFAULT_QUERY = {};
        this.APPEND_QUERY = {};
        this.DEFAULT_SORT = { updated: -1 };
        this.APPEND_SORT = {};
        this.DEFAULT_LIMIT = 500;
    }
    MultiModel.prototype.findLocal = function (options, callback) {
        var _this = this;
        options = this.__parseFindOptions(options);
        core.loggers.system.debug("Find local " + this.PLURAL_NAME + " was started. query=" + JSON.stringify(options['query']) + ", sort=" + JSON.stringify(options['sort']) + ", limit=" + options['limit']);
        this._datastore.find(options['query']).sort(options['sort']).limit(options['limit']).exec(function (err, docs) {
            core.loggers.system.debug("Find local " + _this.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". docs.length=" + docs.length);
            callback(err, docs);
        });
    };
    MultiModel.prototype.countLocal = function (options, callback) {
        var _this = this;
        options = this.__parseFindOptions(options);
        core.loggers.system.debug("Count local #{@PLURAL_NAME} was started. query=#{JSON.stringify(options.query)}");
        this._datastore.count(options['query'], function (err, count) {
            core.loggers.system.debug("Count local " + _this.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". count=" + count);
            callback(err, count);
        });
    };
    MultiModel.prototype.__parseFindOptions = function (options) {
        var result = {};
        // Detect options has query only or has some parameters.
        result['query'] = options['query'] || merge(true, this.DEFAULT_QUERY);
        result['sort'] = options['sort'] || merge(true, this.DEFAULT_SORT);
        result['limit'] = options['limit'] || this.DEFAULT_LIMIT;
        // If some parameter type is string, convert object.
        for (var key in ['query', 'sort']) {
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
        merge(result['query'], this.APPEND_QUERY);
        merge(result['sort'], this.APPEND_SORT);
        return result;
    };
    MultiModel.prototype.saveLocal = function (docs, callback) {
        var _this = this;
        var arrDocs;
        if (!docs || docs['length'] == 0)
            return callback();
        if (!Array.isArray(docs))
            arrDocs = [docs];
        core.loggers.system.debug("Save local " + this.PLURAL_NAME + " was started. docs.count=" + docs['length']);
        async.eachSeries(arrDocs, function (doc, callback) {
            core.loggers.system.trace("Upsert local " + _this.PLURAL_NAME + " was started. guid=" + doc['guid'] + ", title=" + doc[_this.TITLE_FIELD]);
            _this._datastore.update({ guid: doc['guid'] }, doc, { upsert: true }, function (err, numReplaced, newDoc) {
                core.loggers.system.trace("Upsert local " + _this.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". guid=" + doc['guid'] + ", numReplaced=" + numReplaced);
                callback(err);
            });
        }, function (err) {
            core.loggers.system.debug("Save local " + _this.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". docs.count=" + docs['length']);
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
        core.loggers.system.debug("Save local update only " + this.PLURAL_NAME + " was started. docs.count=" + docs['length']);
        async.eachSeries(arrDocs, function (doc, callback) {
            var localDoc = null;
            async.waterfall([
                function (callback) {
                    _this._datastore.find({ guid: doc['guid'] }, callback);
                },
                function (docs, callback) {
                    localDoc = (docs.length == 0) ? null : docs[0];
                    if (localDoc && localDoc.updateSequenceNum >= doc['updateSequenceNum']) {
                        core.loggers.system.trace("Upsert local " + _this.PLURAL_NAME + " was skipped. guid=" + doc['guid'] + ", title=" + doc[_this.TITLE_FIELD]);
                        callback();
                    }
                    else {
                        core.loggers.system.trace("Upsert local " + _this.PLURAL_NAME + " was started. guid=" + doc['guid'] + ", title=" + doc[_this.TITLE_FIELD]);
                        async.waterfall([
                            function (callback) {
                                _this._datastore.db[_this.PLURAL_NAME].update({ guid: doc['guid'] }, doc, { upsert: true }, callback);
                            },
                            function (numReplaced, upsert, callback) {
                                core.loggers.system.trace("Upsert local " + _this.PLURAL_NAME + " was succeed. guid=" + doc['guid'] + ", numReplaced=" + numReplaced);
                                callback();
                            },
                        ], callback);
                    }
                },
            ], callback);
        }, function (err) {
            core.loggers.system.debug("Save local update only " + _this.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". docs.count=" + docs['length']);
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
        core.loggers.system.debug("Remove local " + this.PLURAL_NAME + " was started. query=" + JSON.stringify(query));
        this._datastore.remove(query, { multi: true }, function (err, numRemoved) {
            core.loggers.system.debug("Remove local " + _this.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". numRemoved=" + numRemoved);
            callback(err);
        });
    };
    return MultiModel;
})(model_1.Model);
exports.MultiModel = MultiModel;
//# sourceMappingURL=multi-model.js.map