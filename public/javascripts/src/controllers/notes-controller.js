var core_1 = require('../core');
var NotesController = (function () {
    function NotesController($scope, dataStore) {
        this.$scope = $scope;
        this.dataStore = dataStore;
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['notesSpentTimes'] = {};
        this.$scope['notesProfits'] = {};
        this.$scope['existPersons'] = [];
        this.$scope.$watchCollection('dataStore.timeLogs', this._onWatchTimeLogs);
        this.$scope.$watchCollection('dataStore.profitLogs', this._onWatchProfitLogs);
    }
    NotesController.prototype._onWatchTimeLogs = function (timeLogs) {
        this.$scope['notesSpentTimes'] = {};
        var personsHash = {};
        for (var _i = 0; _i < timeLogs.length; _i++) {
            var noteTimeLog = timeLogs[_i];
            for (var _a = 0; _a < noteTimeLog.length; _a++) {
                var timeLog = noteTimeLog[_a];
                if (!this.$scope['notesSpentTimes'][timeLog.noteGuid])
                    this.$scope['notesSpentTimes'][timeLog.noteGuid] = { $total: 0 };
                this.$scope['notesSpentTimes'][timeLog.noteGuid]['$total'] += timeLog.spentTime;
                if (!this.$scope['notesSpentTimes'][timeLog.noteGuid][timeLog.person])
                    this.$scope['notesSpentTimes'][timeLog.noteGuid][timeLog.person] = 0;
                this.$scope['notesSpentTimes'][timeLog.noteGuid][timeLog.person] += timeLog.spentTime;
                if (!this.$scope['notesSpentTimes']['$total'])
                    this.$scope['notesSpentTimes']['$total'] = { $total: 0 };
                this.$scope['notesSpentTimes']['$total']['$total'] += timeLog.spentTime;
                if (!this.$scope['notesSpentTimes']['$total'][timeLog.person])
                    this.$scope['notesSpentTimes']['$total'][timeLog.person] = 0;
                this.$scope['notesSpentTimes']['$total'][timeLog.person] += timeLog.spentTime;
                if (timeLog.spentTime > 0)
                    personsHash[timeLog.person] = true;
            }
        }
        this.$scope['existPersons'] = Object.keys(personsHash);
    };
    NotesController.prototype._onWatchProfitLogs = function (profitLogs) {
        this.$scope['notesProfits'] = {};
        for (var noteGuid in profitLogs) {
            var noteProfitLog = profitLogs[noteGuid];
            for (var _i = 0; _i < noteProfitLog.length; _i++) {
                var profitLog = noteProfitLog[_i];
                if (!this.$scope['notesProfits'][profitLog.noteGuid])
                    this.$scope['notesProfits'][profitLog.noteGuid] = { $total: 0 };
                this.$scope['notesProfits'][profitLog.noteGuid]['$total'] += profitLog.profit;
                if (!this.$scope['notesProfits']['$total'])
                    this.$scope['notesProfits']['$total'] = { $total: 0 };
                this.$scope['notesProfits']['$total']['$total'] += profitLog.profit;
                for (var _a = 0, _b = this.$scope['existPersons']; _a < _b.length; _a++) {
                    var person = _b[_a];
                    if (!this.$scope['notesSpentTimes'][noteGuid] || !this.$scope['notesSpentTimes'][noteGuid][person] || !this.$scope['notesSpentTimes'][noteGuid]['$total'])
                        this.$scope['notesProfits'][noteGuid][person] = null;
                    else
                        this.$scope['notesProfits'][noteGuid][person] = Math.round(this.$scope['notesProfits'][noteGuid]['$total'] * this.$scope['notesSpentTimes'][noteGuid][person] / this.$scope['notesSpentTimes'][noteGuid]['$total']);
                }
                if (!this.$scope['notesProfits']['$total'][person])
                    this.$scope['notesProfits']['$total'][person] = 0;
                this.$scope['notesProfits']['$total'][person] += this.$scope['notesProfits'][noteGuid][person];
            }
        }
    };
    return NotesController;
})();
core_1["default"].app.controller('NotesController', ['$scope', 'dataStore', NotesController]);
exports.__esModule = true;
exports["default"] = NotesController;
//# sourceMappingURL=notes-controller.js.map