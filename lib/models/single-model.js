var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var merge = require('merge');
var core_1 = require('../core');
var model_1 = require('./model');
var SingleModel = (function (_super) {
    __extends(SingleModel, _super);
    function SingleModel() {
        _super.apply(this, arguments);
        this.DEFAULT_DOC = {};
    }
    SingleModel.prototype.loadLocal = function (callback) {
        var _this = this;
        var query = { _id: 1 };
        var sort = {};
        var limit = 1;
        core_1["default"].loggers.system.debug("Load local " + this.constructor.PLURAL_NAME + " was started.");
        this._datastore.find(query).sort(sort).limit(limit).exec(function (err, docs) {
            core_1["default"].loggers.system.debug("Load local " + _this.constructor.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". docs.length=" + docs.length);
            if (err)
                return callback(err);
            var doc = docs.length == 0 ? merge(true, _this.DEFAULT_DOC) : docs[0];
            callback(null, doc);
        });
    };
    SingleModel.prototype.saveLocal = function (doc, callback) {
        var _this = this;
        doc['_id'] = 1;
        this._datastore.update({ _id: 1 }, doc, { upsert: true }, function (err, numReplaced, newDoc) {
            if (err)
                return callback(err);
            core_1["default"].loggers.system.debug("Upsert " + _this.constructor.PLURAL_NAME + " end. numReplaced=" + numReplaced);
            callback();
        });
    };
    return SingleModel;
})(model_1["default"]);
exports.__esModule = true;
exports["default"] = SingleModel;
//# sourceMappingURL=single-model.js.map