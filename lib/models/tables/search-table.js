var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var multi_table_1 = require('./multi-table');
var SearchTable = (function (_super) {
    __extends(SearchTable, _super);
    function SearchTable() {
        _super.apply(this, arguments);
    }
    SearchTable.PLURAL_NAME = 'searches';
    return SearchTable;
})(multi_table_1.MultiTable);
exports.__esModule = true;
exports["default"] = SearchTable;
//# sourceMappingURL=search-table.js.map