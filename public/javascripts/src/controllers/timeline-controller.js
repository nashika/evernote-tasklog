// Generated by CoffeeScript 1.9.3
(function() {
  var TimelineController, async,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  async = require('async');

  TimelineController = (function() {
    function TimelineController($scope) {
      var container, options;
      this.$scope = $scope;
      this._onResize = bind(this._onResize, this);
      this._onWatchProfitLogs = bind(this._onWatchProfitLogs, this);
      this._onWatchNotes = bind(this._onWatchNotes, this);
      this._onWatchPersons = bind(this._onWatchPersons, this);
      this.$scope.timelineItems = new vis.DataSet();
      this.$scope.timelineGroups = new vis.DataSet();
      container = document.getElementById('timeline');
      options = {
        margin: {
          item: 5
        },
        height: window.innerHeight - 80,
        orientation: {
          axis: 'both',
          item: 'top'
        }
      };
      this.$scope.timeline = new vis.Timeline(container, this.$scope.timelineItems, this.$scope.timelineGroups, options);
      this.$scope.$watchCollection('persons', this._onWatchPersons);
      this.$scope.$watchCollection('notes', this._onWatchNotes);
      this.$scope.$watchCollection('timeLogs', this._onWatchNotes);
      this.$scope.$watchCollection('profitLogs', this._onWatchProfitLogs);
      this.$scope.$on('resize::resize', this._onResize);
    }

    TimelineController.prototype._onWatchPersons = function(newPersons, oldPersons) {
      var key, person;
      this.$scope.timelineGroups.clear();
      for (key in newPersons) {
        person = newPersons[key];
        this.$scope.timelineGroups.add({
          id: key,
          content: person
        });
      }
      return this.$scope.timelineGroups.add({
        id: 'updated',
        content: 'Update'
      });
    };

    TimelineController.prototype._onWatchNotes = function() {
      var _id, end, guid, note, noteGuid, noteTimeLogs, ref, ref1, results, start, timeLog;
      this.$scope.timelineItems.clear();
      ref = this.$scope.notes;
      for (guid in ref) {
        note = ref[guid];
        this.$scope.timelineItems.add({
          id: guid,
          group: 'updated',
          content: note.title,
          start: new Date(note.updated),
          type: 'point'
        });
      }
      ref1 = this.$scope.timeLogs;
      results = [];
      for (noteGuid in ref1) {
        noteTimeLogs = ref1[noteGuid];
        results.push((function() {
          var results1;
          results1 = [];
          for (_id in noteTimeLogs) {
            timeLog = noteTimeLogs[_id];
            start = new Date(timeLog.date);
            if (timeLog.spentTime) {
              end = new Date(start);
              end.setMinutes(start.getMinutes() + timeLog.spentTime);
            } else {
              end = null;
            }
            results1.push(this.$scope.timelineItems.add({
              id: _id,
              group: timeLog.person,
              content: this.$scope.notes[timeLog.noteGuid].title + ' ' + timeLog.comment,
              start: start,
              end: end,
              type: end ? 'range' : 'point'
            }));
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    TimelineController.prototype._onWatchProfitLogs = function(newProfitLogs, oldProfitLogs) {};

    TimelineController.prototype._onResize = function(event) {
      return this.$scope.timeline.setOptions({
        height: window.innerHeight - 80
      });
    };

    return TimelineController;

  })();

  app.controller('TimelineController', ['$scope', TimelineController]);

  module.exports = TimelineController;

}).call(this);

//# sourceMappingURL=timeline-controller.js.map
