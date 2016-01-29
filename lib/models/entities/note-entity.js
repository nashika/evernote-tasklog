var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var evernote = require("evernote");
var NoteEntity = (function (_super) {
    __extends(NoteEntity, _super);
    function NoteEntity() {
        _super.apply(this, arguments);
    }
    return NoteEntity;
})(evernote.Evernote.Note);
exports.__esModule = true;
exports["default"] = NoteEntity;
//# sourceMappingURL=note-entity.js.map