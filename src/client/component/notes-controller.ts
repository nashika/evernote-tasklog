import {DataStoreService} from "../services/data-store";
import {TimeLogEntity} from "../../../../src/common/entities/time-log-entity";
import {ProfitLogEntity} from "../../../../src/common/entities/profit-log-entity";
import {DataTranscieverService} from "../services/data-transciever";

interface INotesControllerScope extends angular.IScope {
    dataStore:DataStoreService;
    notesSpentTimes:{[noteGuid:string]:{[person:string]:number}};
    notesProfits:{[noteGuid:string]:{[person:string]:number}};
    existPersons:Array<string>;
}

class NotesController {

    constructor(protected $scope:INotesControllerScope,
                protected dataStore:DataStoreService,
                protected dataTransciever:DataTranscieverService
    ) {
        this.$scope.dataStore = this.dataStore;
        this.$scope.notesSpentTimes = {};
        this.$scope.notesProfits = {};
        this.$scope.existPersons = [];
        this.$scope.$watchCollection('dataStore.timeLogs', this._onWatchTimeLogs);
        this.$scope.$watchCollection('dataStore.profitLogs', this._onWatchProfitLogs);
        this._onReload();
    }

    protected _onWatchTimeLogs = (timeLogs:{[noteGuid:string]:{[_id:string]:TimeLogEntity}}):void => {
        this.$scope.notesSpentTimes = {};
        var personsHash:{[person:string]:boolean} = {};
        for (var noteGuid in timeLogs) {
            var noteTimeLog = timeLogs[noteGuid];
            for (var timeLogId in noteTimeLog) {
                var timeLog = noteTimeLog[timeLogId];
                if (!this.$scope.notesSpentTimes[timeLog.noteGuid])
                    this.$scope.notesSpentTimes[timeLog.noteGuid] = {$total: 0};
                this.$scope.notesSpentTimes[timeLog.noteGuid]['$total'] += timeLog.spentTime;
                if (!this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person])
                    this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person] = 0;
                this.$scope.notesSpentTimes[timeLog.noteGuid][timeLog.person] += timeLog.spentTime;
                if (!this.$scope.notesSpentTimes['$total'])
                    this.$scope.notesSpentTimes['$total'] = {$total: 0};
                this.$scope.notesSpentTimes['$total']['$total'] += timeLog.spentTime;
                if (!this.$scope.notesSpentTimes['$total'][timeLog.person])
                    this.$scope.notesSpentTimes['$total'][timeLog.person] = 0;
                this.$scope.notesSpentTimes['$total'][timeLog.person] += timeLog.spentTime;
                if (timeLog.spentTime > 0)
                    personsHash[timeLog.person] = true;
            }
        }
        this.$scope.existPersons = Object.keys(personsHash);
    };

    protected _onWatchProfitLogs = (profitLogs:{[noteGuid:string]:{[person:string]:ProfitLogEntity}}):void => {
        this.$scope.notesProfits = {};
        for (var noteGuid in profitLogs) {
            var noteProfitLog = profitLogs[noteGuid];
            for (var profitLogId in noteProfitLog) {
                var profitLog = noteProfitLog[profitLogId];
                if (!this.$scope.notesProfits[profitLog.noteGuid])
                    this.$scope.notesProfits[profitLog.noteGuid] = {$total: 0};
                this.$scope.notesProfits[profitLog.noteGuid]['$total'] += profitLog.profit;
                if (!this.$scope.notesProfits['$total'])
                    this.$scope.notesProfits['$total'] = {$total: 0};
                this.$scope.notesProfits['$total']['$total'] += profitLog.profit;
            }
            for (var person of this.$scope.existPersons) {
                if (!this.$scope.notesSpentTimes[noteGuid] || !this.$scope.notesSpentTimes[noteGuid][person] || !this.$scope.notesSpentTimes[noteGuid]['$total'])
                    this.$scope.notesProfits[noteGuid][person] = null;
                else
                    this.$scope.notesProfits[noteGuid][person] = Math.round(this.$scope.notesProfits[noteGuid]['$total'] * this.$scope.notesSpentTimes[noteGuid][person] / this.$scope.notesSpentTimes[noteGuid]['$total']);
                if (!this.$scope.notesProfits['$total'][person])
                    this.$scope.notesProfits['$total'][person] = 0;
                this.$scope.notesProfits['$total'][person] += this.$scope.notesProfits[noteGuid][person];
            }
        }
    };

    protected _onReload = ():void => {
        this.dataTransciever.reload({getContent: true});
    };

}

angular.module('App').controller('NotesController', ['$scope', 'dataStore', 'dataTransciever', NotesController]);
