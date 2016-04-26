"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var multi_table_1 = require("./multi-table");
var NotebookTable = (function (_super) {
    __extends(NotebookTable, _super);
    function NotebookTable() {
        _super.apply(this, arguments);
    }
    NotebookTable.PLURAL_NAME = 'notebooks';
    NotebookTable.DEFAULT_SORT = { stack: 1, name: 1 };
    return NotebookTable;
}(multi_table_1.MultiTable));
exports.NotebookTable = NotebookTable;
//# sourceMappingURL=notebook-table.js.map