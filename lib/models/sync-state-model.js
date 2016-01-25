var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require('../core');
var single_model_1 = require('./single-model');
var SyncStateModel = (function (_super) {
    __extends(SyncStateModel, _super);
    function SyncStateModel() {
        _super.apply(this, arguments);
    }
    SyncStateModel.prototype.loadRemote = function (callback) {
        var noteStore = core_1["default"].users[this._username].client.getNoteStore();
        noteStore.getSyncState(callback);
    };
    SyncStateModel.PLURAL_NAME = 'syncStates';
    SyncStateModel.DEFAULT_DOC = { updateCount: 0 };
    return SyncStateModel;
})(single_model_1["default"]);
exports.__esModule = true;
exports["default"] = SyncStateModel;
//# sourceMappingURL=sync-state-model.js.map