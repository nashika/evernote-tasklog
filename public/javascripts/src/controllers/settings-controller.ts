import * as async from 'async';

import DataStoreService from "../services/data-store";
import DataTranscieverService from "../services/data-transciever";
import ProgressService from "../services/progress";

interface ISettingsControllerScope extends angular.IScope {
    dataStore:DataStoreService;
    editStore:{[key:string]:any};
    fields:{[field:string]:{[key:string]:any}};
    up:Function;
    down:Function;
    remove:Function;
    add:Function;
    submit:Function;
}

class SettingsController {

    static FIELDS:{[fieldName:string]:{[key:string]:any}} = {
        persons: {
            reParse: true,
            reload: true,
        },
        startWorkingTime: {
            heading: 'Start Working Time',
            type: 'number',
        },
        endWorkingTime: {
            heading: 'End Working Time',
            type: 'number',
        },
    };

    constructor(protected $scope:ISettingsControllerScope,
                protected $http:angular.IHttpService,
                protected dataStore:DataStoreService,
                protected dataTransciever:DataTranscieverService,
                protected progress:ProgressService) {
        this.$scope.dataStore = this.dataStore;
        this.$scope.editStore = {};
        this.$scope.fields = (<typeof SettingsController>this.constructor).FIELDS;
        this.$scope.up = this._up;
        this.$scope.down = this._down;
        this.$scope.remove = this._remove;
        this.$scope.add = this._add;
        this.$scope.submit = this._submit;
        for (var fieldName in (<typeof SettingsController>this.constructor).FIELDS)
            this.$scope.$watch(`dataStore.settings.${fieldName}`, this._onWatchSetting(fieldName));
    }

    protected _up = (index:number):void => {
        if (index == 0) return;
        this.$scope.editStore['persons'].splice(index - 1, 2, this.$scope.editStore['persons'][index], this.$scope.editStore['persons'][index - 1]);
    };

    protected _down = (index:number):void => {
        if (index >= this.$scope.editStore['persons'].length - 1) return;
        this.$scope.editStore['persons'].splice(index, 2, this.$scope.editStore['persons'][index + 1], this.$scope.editStore['persons'][index]);
    };

    protected _remove = (index:number):void => {
        this.$scope.editStore['persons'].splice(index, 1);
    };

    protected _add = ():void => {
        if (!this.$scope.editStore['persons'])
            this.$scope.editStore['persons'] = [];
        this.$scope.editStore['persons'].push({name: `Person ${this.$scope.editStore['persons'].length + 1}`});
    };

    protected _submit = ():void => {
        this.progress.open(1);
        var count = 0;
        var reParse = false;
        var reload = false;
        async.forEachOfSeries((<typeof SettingsController>this.constructor).FIELDS, (field, key, callback) => {
            if (JSON.stringify(angular.copy(this.$scope.editStore[key])) == JSON.stringify(this.dataStore.settings[key]))
                return callback();
            if (field.reParse) reParse = true;
            if (field.reload) reload = true;
            this.progress.set(`Saving ${key}...`, count++ / Object.keys((<typeof SettingsController>this.constructor).FIELDS).length * 100);
            this.$http.put('/settings/save', {key: key, value: this.$scope.editStore[key]})
                .success(() => {
                    this.dataStore.settings[key] = this.$scope.editStore[key];
                    callback();
                })
                .error(() => {
                    callback(new Error(`Error saving ${key}`));
                });
        }, (err) => {
            if (err) alert(err);
            this.progress.close();
            async.waterfall([
                (callback) => {
                    if (reParse)
                        this.dataTransciever.reParse(callback);
                    else
                        callback();
                },
                (callback) => {
                    if (reload)
                        this.dataTransciever.reload(callback);
                    else
                        callback();
                }]);
        });
    };

    protected _onWatchSetting = (key:string):any => {
        return () => {
            this.$scope.editStore[key] = angular.copy(this.dataStore.settings[key]);
        }
    };

}

angular.module('App').controller('SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]);

export default SettingsController;
