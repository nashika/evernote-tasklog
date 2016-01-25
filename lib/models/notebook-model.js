var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var multi_model_1 = require('./multi-model');
var NotebookModel = (function (_super) {
    __extends(NotebookModel, _super);
    function NotebookModel() {
        _super.apply(this, arguments);
    }
    NotebookModel.PLURAL_NAME = 'notebooks';
    NotebookModel.DEFAULT_SORT = { stack: 1, name: 1 };
    return NotebookModel;
})(multi_model_1["default"]);
exports.__esModule = true;
exports["default"] = NotebookModel;
//# sourceMappingURL=notebook-model.js.map