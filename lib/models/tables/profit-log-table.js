var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var async = require('async');
var core_1 = require('../../core');
var multi_table_1 = require('./multi-table');
var ProfitLogTable = (function (_super) {
    __extends(ProfitLogTable, _super);
    function ProfitLogTable() {
        _super.apply(this, arguments);
    }
    ProfitLogTable.prototype.parse = function (note, lines, callback) {
        var _this = this;
        var profitLogs = [];
        for (var _i = 0; _i < lines.length; _i++) {
            var line = lines[_i];
            var matches;
            if (matches = line.match(/(.*)[@＠][\\￥$＄](.+)/i)) {
                profitLogs.push({
                    noteGuid: note.guid,
                    comment: matches[1],
                    profit: parseInt(matches[2].replace(/,/g, ''))
                });
            }
        }
        async.waterfall([
            function (callback) {
                core_1["default"].users[_this._username].models.profitLogs.removeLocal({ noteGuid: note.guid }, callback);
            },
            function (callback) {
                core_1["default"].users[_this._username].models.profitLogs.saveLocal(profitLogs, callback);
            }
        ], callback);
    };
    ProfitLogTable.PLURAL_NAME = 'profitLogs';
    ProfitLogTable.TITLE_FIELD = 'comment';
    ProfitLogTable.DEFAULT_LIMIT = 2000;
    return ProfitLogTable;
})(multi_table_1.MultiTable);
exports.__esModule = true;
exports["default"] = ProfitLogTable;
//# sourceMappingURL=profit-log-table.js.map