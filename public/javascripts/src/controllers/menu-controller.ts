import {DataTranscieverService} from "../services/data-transciever";
import {DataStoreService} from "../services/data-store";

interface IMenuControllerScope extends angular.IScope {
    dataStore:DataStoreService;
    dataTransciever:DataTranscieverService;
    noteCount:number;
    reload:() => void;
}

class MenuController {

    constructor(protected $scope:IMenuControllerScope,
                protected $http:angular.IHttpService,
                protected dataStore:DataStoreService,
                protected dataTransciever:DataTranscieverService) {
        this.$scope.dataStore = this.dataStore;
        this.$scope.dataTransciever = this.dataTransciever;
        this.$scope.noteCount = null;
        this.$scope.reload = this._onReload;
        this.$scope.$watchGroup(['dataTransciever.filterParams.notebookGuids', 'dataTransciever.filterParams.stacks'], this._onWatchFilterParams);
        this.$scope.$on('event::reload', this._onReload);
        this._onReload();
    }

    protected _onReload = ():void => {
        this.dataTransciever.reload({getContent: false});
    };

    protected _onWatchFilterParams = ():void => {
        this.dataTransciever.countNotes((err:Error, count:number) => {
            if (err) {
                alert(err);
                return;
            }
            this.$scope.noteCount = count;
        });
    }

}

angular.module('App').controller('MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', MenuController]);
