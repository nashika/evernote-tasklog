// Generated by CoffeeScript 1.9.3
(function() {
  var DataTranscieverService, async,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  async = require('async');

  DataTranscieverService = (function() {

    /**
     * @constructor
     * @param {$HttpProvider} $http
     * @param {DataStoreService} dataStore
     * @param {NoteQueryService} noteQuery
     * @param {ProgressService} progress
     */
    function DataTranscieverService($http, dataStore, noteQuery, progress) {
      this.$http = $http;
      this.dataStore = dataStore;
      this.noteQuery = noteQuery;
      this.progress = progress;
      this.reload = bind(this.reload, this);
    }


    /**
     * @public
     * @param {function} callback
     */

    DataTranscieverService.prototype.reload = function(callback) {
      var noteCount, query;
      if (!callback) {
        callback = (function(_this) {
          return function() {};
        })(this);
      }
      query = this.noteQuery.query();
      noteCount = 0;
      this.progress.open();
      return async.series([
        (function(_this) {
          return function(callback) {
            if (_this.dataStore.user) {
              return callback();
            }
            _this.progress.set('Getting user data.', 0);
            return _this.$http.get('/user').success(function(data) {
              _this.dataStore.user = data;
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting settings data.', 10);
            return _this.$http.get('/settings').success(function(data) {
              _this.dataStore.settings = data;
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            if (!_this.dataStore.settings.persons || _this.dataStore.settings.persons.length === 0) {
              return callback('This app need persons setting. Please switch "Settings Page" and set your persons data.');
            }
            return callback();
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Syncing remote server.', 20);
            return _this.$http.get('/sync').success(function() {
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting notebooks data.', 30);
            return _this.$http.get('/notebooks').success(function(data) {
              var i, len, notebook, stackHash;
              _this.dataStore.notebooks = {};
              stackHash = {};
              for (i = 0, len = data.length; i < len; i++) {
                notebook = data[i];
                _this.dataStore.notebooks[notebook.guid] = notebook;
                if (notebook.stack) {
                  stackHash[notebook.stack] = true;
                }
              }
              _this.dataStore.stacks = Object.keys(stackHash);
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting notes count.', 40);
            return _this.$http.get('/notes/count', {
              params: {
                query: query
              }
            }).success(function(data) {
              noteCount = data;
              if (noteCount > 100) {
                if (window.confirm("Current query find " + noteCount + " notes. It is too many. Continue anyway?")) {
                  return callback();
                } else {
                  return callback('User Canceled');
                }
              } else {
                return callback();
              }
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Request remote contents.', 50);
            return _this.$http.get('/notes/get-content', {
              params: {
                query: query
              }
            }).success(function() {
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            _this.progress.set('Getting notes.', 70);
            return _this.$http.get('/notes', {
              params: {
                query: query,
                content: false
              }
            }).success(function(data) {
              var i, len, note;
              _this.dataStore.notes = {};
              for (i = 0, len = data.length; i < len; i++) {
                note = data[i];
                _this.dataStore.notes[note.guid] = note;
              }
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            var guids, note, noteGuid;
            _this.progress.set('Getting time logs.', 80);
            guids = (function() {
              var ref, results;
              ref = this.dataStore.notes;
              results = [];
              for (noteGuid in ref) {
                note = ref[noteGuid];
                results.push(note.guid);
              }
              return results;
            }).call(_this);
            return _this.$http.post('/time-logs', {
              query: {
                noteGuid: {
                  $in: guids
                }
              }
            }).success(function(data) {
              var base, i, len, name, timeLog;
              _this.dataStore.timeLogs = {};
              for (i = 0, len = data.length; i < len; i++) {
                timeLog = data[i];
                if ((base = _this.dataStore.timeLogs)[name = timeLog.noteGuid] == null) {
                  base[name] = {};
                }
                _this.dataStore.timeLogs[timeLog.noteGuid][timeLog._id] = timeLog;
              }
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this), (function(_this) {
          return function(callback) {
            var guids, note, noteGuid;
            _this.progress.set('Getting profit logs.', 90);
            guids = (function() {
              var ref, results;
              ref = this.dataStore.notes;
              results = [];
              for (noteGuid in ref) {
                note = ref[noteGuid];
                results.push(note.guid);
              }
              return results;
            }).call(_this);
            return _this.$http.post('/profit-logs', {
              query: {
                noteGuid: {
                  $in: guids
                }
              }
            }).success(function(data) {
              var base, i, len, name, profitLog;
              _this.dataStore.profitLogs = {};
              for (i = 0, len = data.length; i < len; i++) {
                profitLog = data[i];
                if ((base = _this.dataStore.profitLogs)[name = profitLog.noteGuid] == null) {
                  base[name] = {};
                }
                _this.dataStore.profitLogs[profitLog.noteGuid][profitLog._id] = profitLog;
              }
              return callback();
            }).error(function() {
              return callback('Error $http request');
            });
          };
        })(this)
      ], (function(_this) {
        return function(err) {
          if (err) {
            alert(err);
          } else {
            _this.progress.set('Done.', 100);
          }
          _this.progress.close();
          return callback(err);
        };
      })(this));
    };

    DataTranscieverService.prototype.reParse = function(callback) {
      if (!callback) {
        callback = (function(_this) {
          return function() {};
        })(this);
      }
      this.progress.open();
      this.progress.set('Re Parse notes...', 50);
      return async.waterfall([
        (function(_this) {
          return function(callback) {
            return _this.$http.get('/notes/re-parse').success(function(data) {
              return callback();
            }).error(function(data) {
              return callback('Error $http request');
            });
          };
        })(this)
      ], (function(_this) {
        return function(err) {
          _this.progress.set('Done.', 100);
          _this.progress.close();
          return callback(err);
        };
      })(this));
    };

    return DataTranscieverService;

  })();

  app.service('dataTransciever', ['$http', 'dataStore', 'noteQuery', 'progress', DataTranscieverService]);

  module.exports = DataTranscieverService;

}).call(this);

//# sourceMappingURL=data-transciever.js.map
