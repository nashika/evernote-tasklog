"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require('../../core');
var table_1 = require("./table");
var SettingTable = (function (_super) {
    __extends(SettingTable, _super);
    function SettingTable() {
        _super.apply(this, arguments);
    }
    SettingTable.prototype.loadLocal = function (key, callback) {
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
                for (var _i = 0, docs_1 = docs; _i < docs_1.length; _i++) {
                    var doc = docs_1[_i];
                    result[doc._id] = doc.value;
                }
            }
            callback(null, result);
        });
    };
    SettingTable.prototype.saveLocal = function (key, value, callback) {
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
    SettingTable.PLURAL_NAME = 'settings';
    SettingTable.REQUIRE_USER = false;
    return SettingTable;
}(table_1.Table));
exports.SettingTable = SettingTable;
//# sourceMappingURL=setting-table.js.map