var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var async = require('async');
var core_1 = require('../../core');
var multi_table_1 = require('./multi-table');
var TimeLogTable = (function (_super) {
    __extends(TimeLogTable, _super);
    function TimeLogTable() {
        _super.apply(this, arguments);
    }
    TimeLogTable.prototype.parse = function (note, lines, callback) {
        var _this = this;
        var timeLogs = [];
        for (var _i = 0; _i < lines.length; _i++) {
            var line = lines[_i];
            var matches;
            if (matches = line.match(/(.*)[@＠](\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}.+)/)) {
                var timeLog = {
                    noteGuid: note.guid,
                    comment: matches[1],
                    allDay: true,
                    date: null,
                    person: null,
                    spentTime: null
                };
                var attributesText = matches[2];
                // parse date and time
                var dateText = (matches = attributesText.match(/\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2}/)) ? matches[0] : '';
                var timeText = (matches = attributesText.match(/\d{1,2}:\d{1,2}:\d{1,2}|\d{1,2}:\d{1,2}/)) ? matches[0] : '';
                timeLog.date = (new Date(dateText + ' ' + timeText)).getTime();
                if (timeText)
                    timeLog.allDay = false;
                // parse person
                for (var _a = 0, _b = core_1["default"].users[this._username].settings.persons; _a < _b.length; _a++) {
                    var person = _b[_a];
                    if (attributesText.indexOf(person.name) != -1)
                        timeLog.person = person.name;
                }
                // parse spent time
                if (matches = attributesText.match(/\d+h\d+m|\d+m|\d+h|\d+\.\d+h/i)) {
                    var spentTimeText = matches[0];
                    var spentHour = (matches = spentTimeText.match(/(\d+\.?\d*)h/)) ? parseFloat(matches[1]) : 0;
                    var spentMinute = (matches = spentTimeText.match(/(\d+\.?\d*)m/)) ? parseFloat(matches[1]) : 0;
                    timeLog.spentTime = Math.round(spentHour * 60 + spentMinute);
                }
                if (timeLog.date && timeLog.person)
                    timeLogs.push(timeLog);
            }
        }
        async.waterfall([
            function (callback) {
                core_1["default"].users[_this._username].models.timeLogs.removeLocal({ noteGuid: note.guid }, callback);
            },
            function (callback) {
                core_1["default"].users[_this._username].models.timeLogs.saveLocal(timeLogs, callback);
            }
        ], callback);
    };
    TimeLogTable.PLURAL_NAME = 'timeLogs';
    TimeLogTable.TITLE_FIELD = 'comment';
    TimeLogTable.DEFAULT_LIMIT = 2000;
    return TimeLogTable;
})(multi_table_1["default"]);
exports.__esModule = true;
exports["default"] = TimeLogTable;
//# sourceMappingURL=time-log-table.js.map