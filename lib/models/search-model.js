var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var multi_model_1 = require('./multi-model');
var SearchModel = (function (_super) {
    __extends(SearchModel, _super);
    function SearchModel() {
        _super.apply(this, arguments);
    }
    SearchModel.PLURAL_NAME = 'searches';
    return SearchModel;
})(multi_model_1["default"]);
exports.__esModule = true;
exports["default"] = SearchModel;
//# sourceMappingURL=search-model.js.map