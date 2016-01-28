import DataTranscieverService from "../services/data-transciever";
import DataStoreService from "../services/data-store";

class MenuController {

    constructor(protected $scope:angular.IScope,
                protected $http:angular.IHttpService,
                protected dataStore:DataStoreService,
                protected dataTransciever:DataTranscieverService) {
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['dataTransciever'] = this.dataTransciever;
        this.$scope['noteCount'] = null;
        this.$scope.$watchGroup(['dataTransciever.filterParams.notebookGuids', 'dataTransciever.filterParams.stacks'], this._onWatchFilterParams);
        this.$scope.$on('event::reload', this._onReload);
    }

    protected _onReload = ():void => {
        this.dataTransciever.reload();
    }

    protected _onWatchFilterParams = ():void => {
        this.dataTransciever.countNotes((err, count) => {
            if (err) {
                alert(err);
                return;
            }
            this.$scope['noteCount'] = count;
        });
    }

}

angular.module('App').controller('MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', MenuController]);

export default MenuController;
