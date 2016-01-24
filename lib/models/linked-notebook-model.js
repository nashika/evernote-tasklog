var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var multi_model_1 = require('./multi-model');
var LinkedNotebookModel = (function (_super) {
    __extends(LinkedNotebookModel, _super);
    function LinkedNotebookModel() {
        _super.apply(this, arguments);
        this.PLURAL_NAME = 'linkedNotebooks';
    }
    return LinkedNotebookModel;
})(multi_model_1.MultiModel);
module.exports = LinkedNotebookModel;
//# sourceMappingURL=linked-notebook-model.js.map