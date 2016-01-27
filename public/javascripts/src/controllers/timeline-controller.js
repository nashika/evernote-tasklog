var core_1 = require("../core");
var TimelineController = (function () {
    function TimelineController($scope, $filter, $http, dataStore, dataTransciever) {
        var _this = this;
        this.$scope = $scope;
        this.$filter = $filter;
        this.$http = $http;
        this.dataStore = dataStore;
        this.dataTransciever = dataTransciever;
        this.$scope['dataStore'] = this.dataStore;
        this.$scope['timelineItems'] = new vis.DataSet();
        this.$scope['timelineGroups'] = new vis.DataSet();
        this.$scope['start'] = moment().startOf('day');
        this.$scope['end'] = moment().endOf('day');
        this.dataTransciever.reload({ start: this.$scope['start'], end: this.$scope['end'] }, function () {
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
                hiddenDates = {};
            // generate timeline object
            _this.$scope['timeline'] = new vis.Timeline(container, _this.$scope['timelineItems'], _this.$scope['timelineGroups'], {
                margin: { item: 5 },
                height: window.innerHeight - 80,
                orientation: { axis: 'both', item: 'top' },
                start: _this.$scope['start'],
                end: _this.$scope['end'],
                order: function (a, b) {
                    return a.start - b.start;
                },
                hiddenDates: hiddenDates
            });
            // set person data
            if (!_this.dataStore.settings || !_this.dataStore.settings['persons'])
                return;
            for (var _i = 0, _a = _this.dataStore.settings['persons']; _i < _a.length; _i++) {
                var person = _a[_i];
                _this.$scope['timelineGroups'].add({
                    id: person.name,
                    content: person.name
                });
            }
            _this.$scope['timelineGroups'].add({
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
    TimelineController.prototype._onRangeChanged = function (properties) {
        var currentStart = moment(properties.start).startOf('day');
        var currentEnd = moment(properties.end).endOf('day');
        if (currentStart.isSameOrAfter(this.$scope['start']) && currentEnd.isSameOrBefore(this.$scope['end']))
            return;
        if (!this.$scope['start'] || currentStart.isBefore(this.$scope['start']))
            this.$scope['start'] = currentStart;
        if (!this.$scope['end'] || currentEnd.isAfter(this.$scope['end']))
            this.$scope['end'] = currentEnd;
        this._onReload();
    };
    TimelineController.prototype._onReload = function () {
        this.dataTransciever.reload({ start: this.$scope['start'], end: this.$scope['end'] }, this._onReloadEnd);
    };
    TimelineController.prototype._onReloadEnd = function () {
        this.$scope['timelineItems'].clear();
        var notes = {};
        for (var _i = 0, _a = this.dataStore.notes; _i < _a.length; _i++) {
            var note = _a[_i];
            notes[note.guid] = note;
            this.$scope['timelineItems'].add({
                id: note.guid,
                group: 'updated',
                content: "<a href=\"evernote:///view/" + this.dataStore.user['id'] + "/" + this.dataStore.user['shardId'] + "/" + note.guid + "/" + note.guid + "/\" title=\"" + note.title + "\">" + this.$filter('abbreviate')(note.title, 40) + "</a>",
                start: new Date(note.updated),
                type: 'point'
            });
        }
        for (var _b = 0, _c = this.dataStore.timeLogs; _b < _c.length; _b++) {
            var noteTimeLogs = _c[_b];
            for (var _d = 0; _d < noteTimeLogs.length; _d++) {
                var timeLog = noteTimeLogs[_d];
                var noteTitle = notes[timeLog.noteGuid].title;
                this.$scope['timelineItems'].add({
                    id: timeLog._id,
                    group: timeLog.person,
                    content: "<a href=\"evernote:///view/" + this.dataStore.user['id'] + "/" + this.dataStore.user['shardId'] + "/" + timeLog.noteGuid + "/" + timeLog.noteGuid + "/\" title=\"" + noteTitle + " " + timeLog.comment + "\">" + this.$filter('abbreviate')(noteTitle, 20) + " " + this.$filter('abbreviate')(timeLog.comment, 20) + "</a>",
                    start: moment(timeLog.date),
                    end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes') : null,
                    type: timeLog.spentTime ? 'range' : 'point'
                });
            }
        }
    };
    TimelineController.prototype._onResize = function (event) {
        this.$scope['timeline'].setOptions({
            height: window.innerHeight - 90
        });
    };
    return TimelineController;
})();
core_1["default"].app.controller('TimelineController', ['$scope', '$filter', '$http', 'dataStore', 'dataTransciever', TimelineController]);
exports.__esModule = true;
exports["default"] = TimelineController;
//# sourceMappingURL=timeline-controller.js.map