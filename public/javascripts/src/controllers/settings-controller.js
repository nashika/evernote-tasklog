var async = require('async');
var core_1 = require('../core');
var SettingsController = (function () {
    function SettingsController($scope, $http, dataStore, dataTransciever, progress) {
        var _this = this;
        this.$scope = $scope;
        this.$http = $http;
        this.dataStore = dataStore;
        this.dataTransciever = dataTransciever;
        this.progress = progress;
        this._editStore = {};
        this._up = function (index) {
            if (index == 0)
                return;
            _this._editStore['persons'].splice(index - 1, 2, _this._editStore['persons'][index], _this._editStore['persons'][index - 1]);
        };
        this._down = function (index) {
            if (index >= _this._editStore['persons'].length - 1)
                return;
            _this._editStore['persons'].splice(index, 2, _this._editStore['persons'][index + 1], _this._editStore['persons'][index]);
        };
        this._remove = function (index) {
            _this._editStore['persons'].splice(index, 1);
        };
        this._add = function () {
            if (!_this._editStore['persons'])
                _this._editStore['persons'] = [];
            _this._editStore['persons'].push({ name: "Person " + (_this._editStore['persons'].length + 1) });
        };
        this._submit = function () {
            _this.progress.open(1);
            var count = 0;
            var reParse = false;
            var reload = false;
            async.forEachOfSeries(_this.constructor.FIELDS, function (field, key, callback) {
                if (JSON.stringify(angular.copy(_this._editStore[key])) == JSON.stringify(_this.dataStore.settings[key]))
                    return callback();
                if (field.reParse)
                    reParse = true;
                if (field.reload)
                    reload = true;
                _this.progress.set("Saving " + key + "...", count++ / Object.keys(_this.constructor.FIELDS).length * 100);
                _this.$http.put('/settings/save', { key: key, value: _this._editStore[key] })
                    .success(function () {
                    _this.dataStore.settings[key] = _this._editStore[key];
                    callback();
                })
                    .error(function () {
                    callback(new Error("Error saving " + key));
                });
            }, function (err) {
                if (err)
                    alert(err);
                _this.progress.close();
                async.waterfall([
                    function (callback) {
                        if (reParse)
                            _this.dataTransciever.reParse(callback);
                        else
                            callback();
                    },
                    function (callback) {
                        if (reload)
                            _this.dataTransciever.reload(callback);
                        else
                            callback();
                    }]);
            });
        };
        this._onWatchSetting = function (key) {
            return function () {
                _this._editStore[key] = angular.copy(_this.dataStore.settings[key]);
            };
        };
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['editStore'] = this._editStore;
        this.$scope['fields'] = this.constructor.FIELDS;
        this.$scope['up'] = this._up;
        this.$scope['down'] = this._down;
        this.$scope['remove'] = this._remove;
        this.$scope['add'] = this._add;
        this.$scope['submit'] = this._submit;
        for (var key in this.constructor.FIELDS)
            this.$scope.$watch("dataStore.settings." + key, this._onWatchSetting(key));
    }
    SettingsController.FIELDS = {
        persons: {
            reParse: true,
            reload: true
        },
        startWorkingTime: {
            heading: 'Start Working Time',
            type: 'number'
        },
        endWorkingTime: {
            heading: 'End Working Time',
            type: 'number'
        }
    };
    return SettingsController;
})();
core_1["default"].app.controller('SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]);
exports.__esModule = true;
exports["default"] = SettingsController;
//# sourceMappingURL=settings-controller.js.map