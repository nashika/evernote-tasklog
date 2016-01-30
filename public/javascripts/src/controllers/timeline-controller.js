var TimelineController = (function () {
    function TimelineController($scope, $filter, $http, dataStore, dataTransciever) {
        var _this = this;
        this.$scope = $scope;
        this.$filter = $filter;
        this.$http = $http;
        this.dataStore = dataStore;
        this.dataTransciever = dataTransciever;
        this._onRangeChanged = function (properties) {
            var currentStart = moment(properties.start).startOf('day');
            var currentEnd = moment(properties.end).endOf('day');
            if (currentStart.isSameOrAfter(_this.$scope.start) && currentEnd.isSameOrBefore(_this.$scope.end))
                return;
            if (!_this.$scope.start || currentStart.isBefore(_this.$scope.start))
                _this.$scope.start = currentStart;
            if (!_this.$scope.end || currentEnd.isAfter(_this.$scope.end))
                _this.$scope.end = currentEnd;
            _this._onReload();
        };
        this._onReload = function () {
            _this.dataTransciever.reload({ start: _this.$scope.start, end: _this.$scope.end }, _this._onReloadEnd);
        };
        this._onReloadEnd = function () {
            _this.$scope.timelineItems.clear();
            var notes = {};
            for (var noteGuid in _this.dataStore.notes) {
                var note = _this.dataStore.notes[noteGuid];
                notes[note.guid] = note;
                var timelineItem = {
                    id: note.guid,
                    group: 'updated',
                    content: "<a href=\"evernote:///view/" + _this.dataStore.user.id + "/" + _this.dataStore.user.shardId + "/" + note.guid + "/" + note.guid + "/\" title=\"" + note.title + "\">" + _this.$filter('abbreviate')(note.title, 40) + "</a>",
                    start: moment(note.updated).toDate(),
                    type: 'point'
                };
                _this.$scope.timelineItems.add(timelineItem);
            }
            for (var noteGuid in _this.dataStore.timeLogs) {
                var noteTimeLogs = _this.dataStore.timeLogs[noteGuid];
                for (var timeLogId in noteTimeLogs) {
                    var timeLog = noteTimeLogs[timeLogId];
                    var noteTitle = notes[timeLog.noteGuid].title;
                    var timelineItem = {
                        id: timeLog._id,
                        group: timeLog.person,
                        content: "<a href=\"evernote:///view/" + _this.dataStore.user['id'] + "/" + _this.dataStore.user['shardId'] + "/" + timeLog.noteGuid + "/" + timeLog.noteGuid + "/\" title=\"" + noteTitle + " " + timeLog.comment + "\">" + _this.$filter('abbreviate')(noteTitle, 20) + " " + _this.$filter('abbreviate')(timeLog.comment, 20) + "</a>",
                        start: moment(timeLog.date).toDate(),
                        end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes').toDate() : null,
                        type: timeLog.spentTime ? 'range' : 'point'
                    };
                    _this.$scope.timelineItems.add(timelineItem);
                }
            }
        };
        this._onResize = function () {
            _this.$scope['timeline'].setOptions({
                height: window.innerHeight - 90
            });
        };
        this.$scope.dataStore = this.dataStore;
        this.$scope.timelineItems = new vis.DataSet();
        this.$scope.timelineGroups = new vis.DataSet();
        this.$scope.start = moment().startOf('day');
        this.$scope.end = moment().endOf('day');
        this.dataTransciever.reload({ start: this.$scope.start, end: this.$scope.end }, function () {
            var container = document.getElementById('timeline');
            // set working time
            var hiddenDates;
            if (_this.dataStore.settings && _this.dataStore.settings['startWorkingTime'] && _this.dataStore.settings['endWorkingTime'])
                hiddenDates = [{
                        start: moment().subtract(1, 'days').startOf('day').hour(_this.dataStore.settings['endWorkingTime']),
                        end: moment().startOf('day').hour(_this.dataStore.settings['startWorkingTime']),
                        repeat: 'daily'
                    }];
            else
                hiddenDates = [];
            // generate timeline object
            _this.$scope['timeline'] = new vis.Timeline(container, _this.$scope.timelineItems, _this.$scope.timelineGroups, {
                margin: { item: 5 },
                height: window.innerHeight - 80,
                orientation: { axis: 'both', item: 'top' },
                start: _this.$scope.start,
                end: _this.$scope.end,
                order: function (a, b) {
                    return a.start.getTime() - b.start.getTime();
                },
                hiddenDates: hiddenDates
            });
            // set person data
            if (!_this.dataStore.settings || !_this.dataStore.settings['persons'])
                return;
            for (var _i = 0, _a = _this.dataStore.settings['persons']; _i < _a.length; _i++) {
                var person = _a[_i];
                _this.$scope.timelineGroups.add({
                    id: person.name,
                    content: person.name
                });
            }
            _this.$scope.timelineGroups.add({
                id: 'updated',
                content: 'Update'
            });
            // add events
            _this.$scope['timeline'].on('rangechanged', _this._onRangeChanged);
            _this.$scope.$on('resize::resize', _this._onResize);
            _this.$scope.$on('event::reload', _this._onReload);
            // reload
            _this._onReloadEnd();
        });
    }
    return TimelineController;
})();
angular.module('App').controller('TimelineController', ['$scope', '$filter', '$http', 'dataStore', 'dataTransciever', TimelineController]);
//# sourceMappingURL=timeline-controller.js.map