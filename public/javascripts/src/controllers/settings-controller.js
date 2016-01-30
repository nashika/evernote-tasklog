var async = require('async');
var SettingsController = (function () {
    function SettingsController($scope, $http, dataStore, dataTransciever, progress) {
        var _this = this;
        this.$scope = $scope;
        this.$http = $http;
        this.dataStore = dataStore;
        this.dataTransciever = dataTransciever;
        this.progress = progress;
        this._up = function (index) {
            if (index == 0)
                return;
            _this.$scope.editStore['persons'].splice(index - 1, 2, _this.$scope.editStore['persons'][index], _this.$scope.editStore['persons'][index - 1]);
        };
        this._down = function (index) {
            if (index >= _this.$scope.editStore['persons'].length - 1)
                return;
            _this.$scope.editStore['persons'].splice(index, 2, _this.$scope.editStore['persons'][index + 1], _this.$scope.editStore['persons'][index]);
        };
        this._remove = function (index) {
            _this.$scope.editStore['persons'].splice(index, 1);
        };
        this._add = function () {
            if (!_this.$scope.editStore['persons'])
                _this.$scope.editStore['persons'] = [];
            _this.$scope.editStore['persons'].push({ name: "Person " + (_this.$scope.editStore['persons'].length + 1) });
        };
        this._submit = function () {
            _this.progress.open(1);
            var count = 0;
            var reParse = false;
            var reload = false;
            async.forEachOfSeries(_this.constructor.FIELDS, function (field, key, callback) {
                if (JSON.stringify(angular.copy(_this.$scope.editStore[key])) == JSON.stringify(_this.dataStore.settings[key]))
                    return callback();
                if (field.reParse)
                    reParse = true;
                if (field.reload)
                    reload = true;
                _this.progress.set("Saving " + key + "...", count++ / Object.keys(_this.constructor.FIELDS).length * 100);
                _this.$http.put('/settings/save', { key: key, value: _this.$scope.editStore[key] })
                    .success(function () {
                    _this.dataStore.settings[key] = _this.$scope.editStore[key];
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
                _this.$scope.editStore[key] = angular.copy(_this.dataStore.settings[key]);
            };
        };
        this.$scope.dataStore = this.dataStore;
        this.$scope.editStore = {};
        this.$scope.fields = this.constructor.FIELDS;
        this.$scope.up = this._up;
        this.$scope.down = this._down;
        this.$scope.remove = this._remove;
        this.$scope.add = this._add;
        this.$scope.submit = this._submit;
        for (var fieldName in this.constructor.FIELDS)
            this.$scope.$watch("dataStore.settings." + fieldName, this._onWatchSetting(fieldName));
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
angular.module('App').controller('SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]);
//# sourceMappingURL=settings-controller.js.map