"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var multi_table_1 = require("./multi-table");
var TagTable = (function (_super) {
    __extends(TagTable, _super);
    function TagTable() {
        _super.apply(this, arguments);
    }
    TagTable.PLURAL_NAME = 'tags';
    return TagTable;
}(multi_table_1.MultiTable));
exports.TagTable = TagTable;
//# sourceMappingURL=tag-table.js.map