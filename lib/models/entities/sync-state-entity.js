var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var evernote = require("evernote");
var SyncStateEntity = (function (_super) {
    __extends(SyncStateEntity, _super);
    function SyncStateEntity() {
        _super.apply(this, arguments);
    }
    return SyncStateEntity;
})(evernote.Evernote.SyncState);
exports.SyncStateEntity = SyncStateEntity;
//# sourceMappingURL=sync-state-entity.js.map