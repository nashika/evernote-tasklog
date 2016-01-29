var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var evernote = require("evernote");
var TagEntity = (function (_super) {
    __extends(TagEntity, _super);
    function TagEntity() {
        _super.apply(this, arguments);
    }
    return TagEntity;
})(evernote.Evernote.Tag);
exports.__esModule = true;
exports["default"] = TagEntity;
//# sourceMappingURL=tag-entity.js.map