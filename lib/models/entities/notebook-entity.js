"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var evernote = require("evernote");
var NotebookEntity = (function (_super) {
    __extends(NotebookEntity, _super);
    function NotebookEntity() {
        _super.apply(this, arguments);
    }
    return NotebookEntity;
}(evernote.Evernote.Notebook));
exports.NotebookEntity = NotebookEntity;
//# sourceMappingURL=notebook-entity.js.map