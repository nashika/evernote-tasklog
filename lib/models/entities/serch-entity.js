var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var evernote = require("evernote");
var SearchEntity = (function (_super) {
    __extends(SearchEntity, _super);
    function SearchEntity() {
        _super.apply(this, arguments);
    }
    return SearchEntity;
})(evernote.Evernote.SavedSearch);
exports.SearchEntity = SearchEntity;
//# sourceMappingURL=serch-entity.js.map