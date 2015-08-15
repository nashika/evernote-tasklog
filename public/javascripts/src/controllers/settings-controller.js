// Generated by CoffeeScript 1.9.3
(function() {
  var SettingsController, async,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  async = require('async');

  SettingsController = (function() {
    SettingsController.prototype.FIELDS = {
      startWorkingTime: {
        heading: 'Start Working Time',
        type: 'number'
      },
      endWorkingTime: {
        heading: 'End Working Time',
        type: 'number'
      }
    };

    SettingsController.prototype.editStore = {};

    function SettingsController($scope, $http, dataStore, dataTransciever, progress) {
      var field, key, ref;
      this.$scope = $scope;
      this.$http = $http;
      this.dataStore = dataStore;
      this.dataTransciever = dataTransciever;
      this.progress = progress;
      this._onSubmit = bind(this._onSubmit, this);
      this._onWatchSetting = bind(this._onWatchSetting, this);
      this._onWatchPersons = bind(this._onWatchPersons, this);
      this._submit = bind(this._submit, this);
      this._add = bind(this._add, this);
      this._remove = bind(this._remove, this);
      this._down = bind(this._down, this);
      this._up = bind(this._up, this);
      this.$scope.dataStore = this.dataStore;
      this.$scope.fields = this.FIELDS;
      this.$scope.editStore = this.editStore;
      this.$scope.editPersons = [];
      this.$scope.up = this._up;
      this.$scope.down = this._down;
      this.$scope.remove = this._remove;
      this.$scope.add = this._add;
      this.$scope.submit = this._submit;
      this.$scope.submit2 = this._onSubmit;
      this.$scope.$watchCollection('dataStore.settings.persons', this._onWatchPersons);
      ref = this.FIELDS;
      for (key in ref) {
        field = ref[key];
        this.$scope.$watch("dataStore.settings." + key, this._onWatchSetting(key));
      }
    }

    SettingsController.prototype._up = function(index) {
      if (index === 0) {
        return;
      }
      return this.$scope.editPersons.splice(index - 1, 2, this.$scope.editPersons[index], this.$scope.editPersons[index - 1]);
    };

    SettingsController.prototype._down = function(index) {
      if (index >= this.$scope.editPersons.length - 1) {
        return;
      }
      return this.$scope.editPersons.splice(index, 2, this.$scope.editPersons[index + 1], this.$scope.editPersons[index]);
    };

    SettingsController.prototype._remove = function(index) {
      return this.$scope.editPersons.splice(index, 1);
    };

    SettingsController.prototype._add = function() {
      return this.$scope.editPersons.push({
        name: "Person " + (this.$scope.editPersons.length + 1)
      });
    };

    SettingsController.prototype._submit = function() {
      this.progress.open();
      this.progress.set('Saving persons data...', 0);
      return this.$http.put('/settings/save', {
        key: 'persons',
        value: this.$scope.editPersons
      }).success((function(_this) {
        return function(data) {};
      })(this)).error((function(_this) {
        return function(data) {};
      })(this))["finally"]((function(_this) {
        return function() {
          _this.progress.close();
          return _this.dataTransciever.reParse();
        };
      })(this));
    };

    SettingsController.prototype._onWatchPersons = function() {
      var ref;
      if ((ref = this.dataStore.settings) != null ? ref.persons : void 0) {
        return this.$scope.editPersons = this.dataStore.settings.persons;
      }
    };

    SettingsController.prototype._onWatchSetting = function(key) {
      return (function(_this) {
        return function() {
          var ref;
          return _this.editStore[key] = (ref = _this.dataStore.settings) != null ? ref[key] : void 0;
        };
      })(this);
    };

    SettingsController.prototype._onSubmit = function() {
      var count;
      this.progress.open();
      count = 0;
      return async.forEachOfSeries(this.FIELDS, (function(_this) {
        return function(field, key, callback) {
          if (_this.editStore[key] === _this.dataStore.settings[key]) {
            return callback();
          }
          _this.progress.set("Saving " + key + "...", count++ / Object.keys(_this.FIELDS).count * 100);
          return _this.$http.put('/settings/save', {
            key: key,
            value: _this.editStore[key]
          }).success(function() {
            return callback();
          }).error(function() {
            return callback("Error saving " + key);
          });
        };
      })(this), (function(_this) {
        return function(err) {
          if (err) {
            alert(err);
          }
          return _this.progress.close();
        };
      })(this));
    };

    return SettingsController;

  })();

  app.controller('SettingsController', ['$scope', '$http', 'dataStore', 'dataTransciever', 'progress', SettingsController]);

  module.exports = SettingsController;

}).call(this);

//# sourceMappingURL=settings-controller.js.map
