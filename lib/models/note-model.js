var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var async = require('async');
var merge = require('merge');
var core_1 = require('../core');
var multi_model_1 = require('./multi-model');
var NoteModel = (function (_super) {
    __extends(NoteModel, _super);
    function NoteModel() {
        _super.apply(this, arguments);
    }
    NoteModel.prototype.findLocal = function (options, callback) {
        _super.prototype.findLocal.call(this, options, function (err, notes) {
            if (options['content']) {
                callback(null, notes);
            }
            else {
                var results = [];
                for (var note in notes) {
                    var result = merge(true, note);
                    result.hasContent = result.content != null;
                    result.content = null;
                    results.push(result);
                }
                callback(null, results);
            }
        });
    };
    NoteModel.prototype.getRemoteContent = function (options, callback) {
        var _this = this;
        this.findLocal(options, function (err, notes) {
            if (err)
                return callback(err);
            var result = [];
            async.eachSeries(notes, function (note, callback) {
                if (note['content'] || note['hasContent']) {
                    result.push(note);
                    callback();
                }
                else {
                    _this.loadRemote(note['guid'], function (err, loadedNote) {
                        if (err)
                            return callback(err);
                        result.push(loadedNote);
                        // TODO: set hasContentProperty
                        callback();
                    });
                }
            }, function (err) {
                if (err)
                    return callback(err);
                callback(null, result);
            });
        });
    };
    NoteModel.prototype.loadRemote = function (guid, callback) {
        var _this = this;
        core_1["default"].loggers.system.debug("Loading note from remote was started. guid=" + guid);
        var noteStore = core_1["default"].users[this._username].client.getNoteStore();
        var lastNote = null;
        async.waterfall([
            function (callback) {
                noteStore.getNote(guid, true, false, false, false, callback);
            },
            function (note, callback) {
                core_1["default"].loggers.system.debug("Loading note was succeed. guid=" + note.guid + " title=" + note[_this.constructor.TITLE_FIELD]);
                lastNote = note;
                core_1["default"].loggers.system.debug("Saving note to local. guid=" + note.guid);
                _this._datastore.update({ guid: note.guid }, note, { upsert: true }, callback);
            },
            function (numReplaced, upsert, callback) {
                core_1["default"].loggers.system.debug("Saving note was succeed. guid=" + lastNote.guid + " numReplaced=" + numReplaced);
                callback();
            },
            function (callback) {
                _this._parseNote(lastNote, callback);
            },
        ], function (err) {
            if (err)
                return callback(err);
            core_1["default"].loggers.system.debug("Loading note from remote was finished. note is loaded. guid=" + lastNote.guid + " title=" + lastNote.title);
            callback(null, lastNote);
        });
    };
    NoteModel.prototype.reParseNotes = function (options, callback) {
        var _this = this;
        if (!options)
            options = {};
        options['limit'] = 0;
        options['content'] = true;
        this.findLocal(options, function (err, notes) {
            if (err)
                return callback(err);
            async.eachSeries(notes, function (note, callback) {
                _this._parseNote(note, callback);
            }, callback);
        });
    };
    NoteModel.prototype._parseNote = function (note, callback) {
        var _this = this;
        if (!note['content'])
            return callback();
        core_1["default"].loggers.system.debug("Parsing note was started. guid=" + note['guid']);
        var content = note['content'];
        content = content.replace(/\r\n|\r|\n|<br\/>|<\/div>|<\/ul>|<\/li>/g, '<>');
        var lines = [];
        for (var line in content.split('<>')) {
            lines.push(line.replace(/<[^>]*>/g, ''));
        }
        async.waterfall([
            function (callback) {
                core_1["default"].users[_this._username].models.timeLogs.parse(note, lines, callback);
            },
            function (callback) {
                core_1["default"].users[_this._username].models.profitLogs.parse(note, lines, callback);
            },
        ], function (err) {
            core_1["default"].loggers.system.debug("\"Parsing note was #{if err then 'failed' else 'succeed'}. guid=#{note.guid}");
            callback(err);
        });
    };
    NoteModel.PLURAL_NAME = 'notes';
    NoteModel.TITLE_FIELD = 'title';
    NoteModel.APPEND_QUERY = { deleted: null };
    return NoteModel;
})(multi_model_1["default"]);
exports.__esModule = true;
exports["default"] = NoteModel;
//# sourceMappingURL=note-model.js.map