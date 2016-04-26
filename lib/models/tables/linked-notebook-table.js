"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var multi_table_1 = require("./multi-table");
var LinkedNotebookTable = (function (_super) {
    __extends(LinkedNotebookTable, _super);
    function LinkedNotebookTable() {
        _super.apply(this, arguments);
    }
    LinkedNotebookTable.PLURAL_NAME = 'linkedNotebooks';
    return LinkedNotebookTable;
}(multi_table_1.MultiTable));
exports.LinkedNotebookTable = LinkedNotebookTable;
//# sourceMappingURL=linked-notebook-table.js.map