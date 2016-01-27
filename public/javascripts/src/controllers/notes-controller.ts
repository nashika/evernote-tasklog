import core from '../core';
import DataStoreService from "../services/data-store";

class NotesController {

    constructor(
        protected $scope:angular.IScope,
        protected dataStore:DataStoreService
    ) {
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['notesSpentTimes'] = {};
        this.$scope['notesProfits'] = {};
        this.$scope['existPersons'] = [];
        this.$scope.$watchCollection('dataStore.timeLogs', this._onWatchTimeLogs);
        this.$scope.$watchCollection('dataStore.profitLogs', this._onWatchProfitLogs);
    }

    _onWatchTimeLogs(timeLogs):void {
        this.$scope['notesSpentTimes'] = {};
        var personsHash = {};
        for (var noteTimeLog of timeLogs)
            for (var timeLog of noteTimeLog) {
                if (!this.$scope['notesSpentTimes'][timeLog.noteGuid])
                    this.$scope['notesSpentTimes'][timeLog.noteGuid] = {$total: 0};
                this.$scope['notesSpentTimes'][timeLog.noteGuid]['$total'] += timeLog.spentTime;
                if (!this.$scope['notesSpentTimes'][timeLog.noteGuid][timeLog.person])
                    this.$scope['notesSpentTimes'][timeLog.noteGuid][timeLog.person] = 0;
                this.$scope['notesSpentTimes'][timeLog.noteGuid][timeLog.person] += timeLog.spentTime;
                if (!this.$scope['notesSpentTimes']['$total'])
                    this.$scope['notesSpentTimes']['$total'] = {$total: 0};
                this.$scope['notesSpentTimes']['$total']['$total'] += timeLog.spentTime;
                if (!this.$scope['notesSpentTimes']['$total'][timeLog.person])
                    this.$scope['notesSpentTimes']['$total'][timeLog.person] = 0;
                this.$scope['notesSpentTimes']['$total'][timeLog.person] += timeLog.spentTime;
                if (timeLog.spentTime > 0)
                    personsHash[timeLog.person] = true;
            }
        this.$scope['existPersons'] = Object.keys(personsHash);
    }

    _onWatchProfitLogs(profitLogs):void {
        this.$scope['notesProfits'] = {};
        for (var noteGuid in profitLogs) {
            var noteProfitLog = profitLogs[noteGuid];
            for (var profitLog of noteProfitLog) {
                if (!this.$scope['notesProfits'][profitLog.noteGuid])
                    this.$scope['notesProfits'][profitLog.noteGuid] = {$total: 0};
                this.$scope['notesProfits'][profitLog.noteGuid]['$total'] += profitLog.profit;
                if (!this.$scope['notesProfits']['$total'])
                    this.$scope['notesProfits']['$total'] = {$total: 0};
                this.$scope['notesProfits']['$total']['$total'] += profitLog.profit;
                for (var person of this.$scope['existPersons'])
                    if (!this.$scope['notesSpentTimes'][noteGuid] || !this.$scope['notesSpentTimes'][noteGuid][person] || !this.$scope['notesSpentTimes'][noteGuid]['$total'])
                        this.$scope['notesProfits'][noteGuid][person] = null;
                    else
                        this.$scope['notesProfits'][noteGuid][person] = Math.round(this.$scope['notesProfits'][noteGuid]['$total'] * this.$scope['notesSpentTimes'][noteGuid][person] / this.$scope['notesSpentTimes'][noteGuid]['$total']);
                if (!this.$scope['notesProfits']['$total'][person])
                    this.$scope['notesProfits']['$total'][person] = 0;
                this.$scope['notesProfits']['$total'][person] += this.$scope['notesProfits'][noteGuid][person];
            }
        }
    }

}

core.app.controller('NotesController', ['$scope', 'dataStore', NotesController]);

export default NotesController;
