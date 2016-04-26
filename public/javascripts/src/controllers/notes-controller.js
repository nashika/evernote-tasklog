"use strict";
var NotesController = (function () {
    function NotesController($scope, dataStore, dataTransciever) {
        var _this = this;
        this.$scope = $scope;
        this.dataStore = dataStore;
        this.dataTransciever = dataTransciever;
        this._onWatchTimeLogs = function (timeLogs) {
            _this.$scope.notesSpentTimes = {};
            var personsHash = {};
            for (var noteGuid in timeLogs) {
                var noteTimeLog = timeLogs[noteGuid];
                for (var timeLogId in noteTimeLog) {
                    var timeLog = noteTimeLog[timeLogId];
                    if (!_this.$scope.notesSpentTimes[timeLog.noteGuid])
                        _this.$scope.notesSpentTimes[timeLog.noteGuid] = { $total: 0 };
                    _this.$scope.notesSpentTimes[timeLog.noteGuid]['$total'] += timeLog.spentTime;
                    if (!_this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person])
                        _this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person] = 0;
                    _this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person] += timeLog.spentTime;
                    if (!_this.$scope.notesSpentTimes['$total'])
                        _this.$scope.notesSpentTimes['$total'] = { $total: 0 };
                    _this.$scope.notesSpentTimes['$total']['$total'] += timeLog.spentTime;
                    if (!_this.$scope.notesSpentTimes['$total'][timeLog.person])
                        _this.$scope.notesSpentTimes['$total'][timeLog.person] = 0;
                    _this.$scope.notesSpentTimes['$total'][timeLog.person] += timeLog.spentTime;
                    if (timeLog.spentTime > 0)
                        personsHash[timeLog.person] = true;
                }
            }
            _this.$scope.existPersons = Object.keys(personsHash);
        };
        this._onWatchProfitLogs = function (profitLogs) {
            _this.$scope.notesProfits = {};
            for (var noteGuid in profitLogs) {
                var noteProfitLog = profitLogs[noteGuid];
                for (var profitLogId in noteProfitLog) {
                    var profitLog = noteProfitLog[profitLogId];
                    if (!_this.$scope.notesProfits[profitLog.noteGuid])
                        _this.$scope.notesProfits[profitLog.noteGuid] = { $total: 0 };
                    _this.$scope.notesProfits[profitLog.noteGuid]['$total'] += profitLog.profit;
                    if (!_this.$scope.notesProfits['$total'])
                        _this.$scope.notesProfits['$total'] = { $total: 0 };
                    _this.$scope.notesProfits['$total']['$total'] += profitLog.profit;
                }
                for (var _i = 0, _a = _this.$scope.existPersons; _i < _a.length; _i++) {
                    var person = _a[_i];
                    if (!_this.$scope.notesSpentTimes[noteGuid] || !_this.$scope.notesSpentTimes[noteGuid][person] || !_this.$scope.notesSpentTimes[noteGuid]['$total'])
                        _this.$scope.notesProfits[noteGuid][person] = null;
                    else
                        _this.$scope.notesProfits[noteGuid][person] = Math.round(_this.$scope.notesProfits[noteGuid]['$total'] * _this.$scope.notesSpentTimes[noteGuid][person] / _this.$scope.notesSpentTimes[noteGuid]['$total']);
                    if (!_this.$scope.notesProfits['$total'][person])
                        _this.$scope.notesProfits['$total'][person] = 0;
                    _this.$scope.notesProfits['$total'][person] += _this.$scope.notesProfits[noteGuid][person];
                }
            }
        };
        this._onReload = function () {
            _this.dataTransciever.reload({ getContent: true });
        };
        this.$scope.dataStore = this.dataStore;
        this.$scope.notesSpentTimes = {};
        this.$scope.notesProfits = {};
        this.$scope.existPersons = [];
        this.$scope.$watchCollection('dataStore.timeLogs', this._onWatchTimeLogs);
        this.$scope.$watchCollection('dataStore.profitLogs', this._onWatchProfitLogs);
        this._onReload();
    }
    return NotesController;
}());
angular.module('App').controller('NotesController', ['$scope', 'dataStore', 'dataTransciever', NotesController]);
//# sourceMappingURL=notes-controller.js.map