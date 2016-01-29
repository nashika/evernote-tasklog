var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var evernote = require("evernote");
var LinkedNotebookEntity = (function (_super) {
    __extends(LinkedNotebookEntity, _super);
    function LinkedNotebookEntity() {
        _super.apply(this, arguments);
    }
    return LinkedNotebookEntity;
})(evernote.Evernote.LinkedNotebook);
exports.LinkedNotebookEntity = LinkedNotebookEntity;
exports.__esModule = true;
exports["default"] = LinkedNotebookEntity;
//# sourceMappingURL=linked-notebook-entity.js.map