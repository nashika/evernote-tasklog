import * as async from 'async';

import {DataTranscieverService} from "../services/data-transciever";
import {DataStoreService} from "../services/data-store";

interface IMenuControllerScope extends angular.IScope {
    dataStore:DataStoreService;
    dataTransciever:DataTranscieverService;
    noteCount:number;
    allNoteCount:number;
    loadedNoteCount:number;
    allLoadedNoteCount:number;
    timeLogCount:number;
    allTimeLogCount:number;
    profitLogCount:number;
    allProfitLogCount:number;
    reload:() => void;
}

class MenuController {

    constructor(protected $scope:IMenuControllerScope,
                protected $http:angular.IHttpService,
                protected dataStore:DataStoreService,
                protected dataTransciever:DataTranscieverService) {
        this.$scope.dataStore = this.dataStore;
        this.$scope.dataTransciever = this.dataTransciever;
        this.$scope.noteCount = 0;
        this.$scope.allNoteCount = 0;
        this.$scope.loadedNoteCount = 0;
        this.$scope.allLoadedNoteCount = 0;
        this.$scope.timeLogCount = 0;
        this.$scope.allTimeLogCount = 0;
        this.$scope.profitLogCount = 0;
        this.$scope.allProfitLogCount = 0;
        this.$scope.reload = this._onReload;
        this.$scope.$watchGroup(['dataTransciever.filterParams.notebookGuids', 'dataTransciever.filterParams.stacks'], this._onWatchFilterParams);
        this.$scope.$on('event::reload', this._onReload);
        this._onReload();
    }

    protected _onReload = ():void => {
        this.dataTransciever.reload({getContent: false});
    };

    protected _onWatchFilterParams = ():void => {
        async.waterfall([
            (callback:(err?:Error) => void) => {
                this.dataTransciever.countNotes({}, (err:Error, count:number) => {
                    if (!err) this.$scope.noteCount = count;
                    callback(err);
                });
            },
            (callback:(err?:Error) => void) => {
                this.dataTransciever.countNotes({noFilter: true}, (err:Error, count:number) => {
                    if (!err) this.$scope.allNoteCount = count;
                    callback(err);
                });
            },
            (callback:(err?:Error) => void) => {
                this.dataTransciever.countNotes({hasContent:true}, (err:Error, count:number) => {
                    if (!err) this.$scope.loadedNoteCount = count;
                    callback(err);
                });
            },
            (callback:(err?:Error) => void) => {
                this.dataTransciever.countNotes({hasContent:true, noFilter: true}, (err:Error, count:number) => {
                    if (!err) this.$scope.allLoadedNoteCount = count;
                    callback(err);
                });
            },
            (callback:(err?:Error) => void) => {
                this.dataTransciever.countTimeLogs({}, (err:Error, count:number) => {
                    if (!err) this.$scope.timeLogCount = count;
                    callback(err);
                });
            },
            (callback:(err?:Error) => void) => {
                this.dataTransciever.countTimeLogs({noFilter:true}, (err:Error, count:number) => {
                    if (!err) this.$scope.allTimeLogCount = count;
                    callback(err);
                });
            },
        ], (err?:Error):void => {
            if (err) alert(err);
        });
    }

}

angular.module('App').controller('MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', MenuController]);
