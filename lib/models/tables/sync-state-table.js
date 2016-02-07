var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require('../../core');
var single_table_1 = require("./single-table");
var SyncStateTable = (function (_super) {
    __extends(SyncStateTable, _super);
    function SyncStateTable() {
        _super.apply(this, arguments);
    }
    SyncStateTable.prototype.loadRemote = function (callback) {
        var noteStore = core_1["default"].users[this._username].client.getNoteStore();
        noteStore.getSyncState(callback);
    };
    SyncStateTable.PLURAL_NAME = 'syncStates';
    SyncStateTable.DEFAULT_DOC = { updateCount: 0 };
    return SyncStateTable;
})(single_table_1.SingleTable);
exports.SyncStateTable = SyncStateTable;
//# sourceMappingURL=sync-state-table.js.map