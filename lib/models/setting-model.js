var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require('../core');
var Model_1 = require('./Model');
var SettingModel = (function (_super) {
    __extends(SettingModel, _super);
    function SettingModel() {
        _super.apply(this, arguments);
    }
    SettingModel.prototype.loadLocal = function (key, callback) {
        var _this = this;
        core_1["default"].loggers.system.debug("Load local " + this.constructor.PLURAL_NAME + " was started. key=" + key);
        var query, limit;
        if (key) {
            query = { _id: key };
            limit = 1;
        }
        else {
            query = {};
            limit = 0;
        }
        this._datastore.find(query).sort({}).limit(limit).exec(function (err, docs) {
            core_1["default"].loggers.system.debug("Load local " + _this.constructor.PLURAL_NAME + " was " + (err ? 'failed' : 'succeed') + ". docs.length=" + docs.length);
            if (err)
                return callback(err);
            var result;
            if (key) {
                result = docs.length == 0 ? null : docs[0].value;
            }
            else {
                result = {};
                for (var doc in docs) {
                    result[doc._id] = doc.value;
                }
            }
            callback(null, result);
        });
    };
    SettingModel.prototype.saveLocal = function (key, value, callback) {
        var _this = this;
        var doc = { _id: key, value: value };
        this._datastore.update({ _id: key }, doc, { upsert: true }, function (err, numReplaced, newDoc) {
            if (err)
                return callback(err);
            if (_this._username)
                core_1["default"].users[_this._username].settings[key] = value;
            else
                core_1["default"].settings[key] = value;
            core_1["default"].loggers.system.debug("Upsert " + _this.constructor.PLURAL_NAME + " end. numReplaced=" + numReplaced);
            callback();
        });
    };
    SettingModel.PLURAL_NAME = 'settings';
    SettingModel.REQUIRE_USER = false;
    return SettingModel;
})(Model_1["default"]);
exports.__esModule = true;
exports["default"] = SettingModel;
//# sourceMappingURL=setting-model.js.map