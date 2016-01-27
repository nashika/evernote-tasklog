import * as async from 'async';

import core from '../core';
import DataStoreService from "../services/data-store";
import DataTranscieverService from "../services/data-transciever";
import ProgressService from "../services/progress";

class SettingsController {

    static FIELDS = {
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

    protected _editStore:Object = {};

    constructor(protected $scope:angular.IScope,
                protected $http:angular.IHttpService,
                protected dataStore:DataStoreService,
                protected dataTransciever:DataTranscieverService,
                protected progress:ProgressService) {
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['editStore'] = this._editStore;
        this.$scope['fields'] = (<typeof SettingsController>this.constructor).FIELDS;
        this.$scope['up'] = this._up;
        this.$scope['down'] = this._down;
        this.$scope['remove'] = this._remove;
        this.$scope['add'] = this._add;
        this.$scope['submit'] = this._submit;
        for (var key in (<typeof SettingsController>this.constructor).FIELDS)
            this.$scope.$watch(`dataStore.settings.${key}`, this._onWatchSetting(key));
    }

    _up(index):void {
        if (index == 0) return;
        this._editStore['persons'].splice(index - 1, 2, this._editStore['persons'][index], this._editStore['persons'][index - 1]);
    }

    _down(index):void {
        if (index >= this._editStore['persons'].length - 1) return;
        this._editStore['persons'].splice(index, 2, this._editStore['persons'][index + 1], this._editStore['persons'][index]);
    }

    _remove(index):void {
        this._editStore['persons'].splice(index, 1);
    }

    _add():void {
        if (!this._editStore['persons'])
            this._editStore['persons'] = [];
        this._editStore['persons'].push({name: `Person ${this._editStore['persons'].length + 1}`});
    }

    _submit():void {
        this.progress.open(1);
        var count = 0;
        var reParse = false;
        var reload = false;
        async.forEachOfSeries((<typeof SettingsController>this.constructor).FIELDS, (field, key, callback) => {
            if (JSON.stringify(angular.copy(this._editStore[key])) == JSON.stringify(this.dataStore.settings[key]))
                return callback();
            if (field.reParse) reParse = true;
            if (field.reload) reload = true;
            this.progress.set(`Saving ${key}...`, count++ / Object.keys((<typeof SettingsController>this.constructor).FIELDS).length * 100);
            this.$http.put('/settings/save', {key: key, value: this._editStore[key]})
                .success(() => {
                    this.dataStore.settings[key] = this._editStore[key];
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
    }

    _onWatchSetting(key):any {
        return () => {
            this._editStore[key] = angular.copy(this.dataStore.settings || [key]);
        }
    }

}

core.app.controller('SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]);

export default SettingsController;
