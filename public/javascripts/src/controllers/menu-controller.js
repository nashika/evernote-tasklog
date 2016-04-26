"use strict";
var async = require('async');
var MenuController = (function () {
    function MenuController($scope, $http, dataStore, dataTransciever) {
        var _this = this;
        this.$scope = $scope;
        this.$http = $http;
        this.dataStore = dataStore;
        this.dataTransciever = dataTransciever;
        this._onReload = function () {
            _this.dataTransciever.reload({ getContent: false });
        };
        this._onWatchFilterParams = function () {
            async.waterfall([
                function (callback) {
                    _this.dataTransciever.countNotes({}, function (err, count) {
                        if (!err)
                            _this.$scope.noteCount = count;
                        callback(err);
                    });
                },
                function (callback) {
                    _this.dataTransciever.countNotes({ noFilter: true }, function (err, count) {
                        if (!err)
                            _this.$scope.allNoteCount = count;
                        callback(err);
                    });
                },
                function (callback) {
                    _this.dataTransciever.countNotes({ hasContent: true }, function (err, count) {
                        if (!err)
                            _this.$scope.loadedNoteCount = count;
                        callback(err);
                    });
                },
                function (callback) {
                    _this.dataTransciever.countNotes({ hasContent: true, noFilter: true }, function (err, count) {
                        if (!err)
                            _this.$scope.allLoadedNoteCount = count;
                        callback(err);
                    });
                },
                function (callback) {
                    _this.dataTransciever.countTimeLogs({}, function (err, count) {
                        if (!err)
                            _this.$scope.timeLogCount = count;
                        callback(err);
                    });
                },
                function (callback) {
                    _this.dataTransciever.countTimeLogs({ noFilter: true }, function (err, count) {
                        if (!err)
                            _this.$scope.allTimeLogCount = count;
                        callback(err);
                    });
                },
            ], function (err) {
                if (err)
                    alert(err);
            });
        };
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
    return MenuController;
}());
angular.module('App').controller('MenuController', ['$scope', '$http', 'dataStore', 'dataTransciever', MenuController]);
//# sourceMappingURL=menu-controller.js.map